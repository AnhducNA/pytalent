import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameResultService } from './gameResult.service';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Repository } from 'typeorm';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { ResponseInterface } from '@shared/interfaces/response.interface';

@Injectable()
export class LogicalGameResultService {
  constructor(
    @InjectRepository(LogicalGameResult)
    private readonly logicalGameResultRepository: Repository<LogicalGameResult>,
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {}

  async caculatePlayingLogical(
    id: number,
    answerPlay: boolean,
  ): Promise<ResponseInterface> {
    // get logical_game_result place hold
    const logicalAnswerPlaceHold = await this.findLogicalAnswerPlaceHold(id);
    const gameResultUpdate = await this.gameResultService.findOne(
      logicalAnswerPlaceHold.game_result_id,
    );
    const validateGameResult = await this.validateGameResult(
      gameResultUpdate,
      logicalAnswerPlaceHold,
    );
    console.log(validateGameResult);

    // have validate => end game
    if (validateGameResult.status === false) {
      await this.gameResultService.updateFinishGame(gameResultUpdate.id);
      return { message: validateGameResult.message };
    }

    // check logical answer is true or false
    const checkCorrectAnswer = await this.checkCorrectAnswer(
      answerPlay,
      gameResultUpdate.play_score,
      logicalAnswerPlaceHold,
    );
    // update new playScore and new playTime
    await this.gameResultService.updateGameResultPlayTimeAndScore({
      id: gameResultUpdate.id,
      play_time: Date.now() - gameResultUpdate.time_start.getTime(),
      play_score: checkCorrectAnswer.data.newPlayScore,
    });

    // update answer in LogicalGameResult
    await this.gameResultService.updateLogicalAnswered(
      logicalAnswerPlaceHold.id,
      answerPlay,
      checkCorrectAnswer.isCorrect,
    );

    // Check final logical game => compare index question with total question
    if (logicalAnswerPlaceHold.index >= 20) {
      await this.gameResultService.updateFinishGame(gameResultUpdate.id);
      return {
        message: 'End Game',
      };
    }
    const logicalQuestionNext = await this.getNextLogicalQuestion(
      logicalAnswerPlaceHold.index,
      gameResultUpdate.id,
    );
    return {
      message: checkCorrectAnswer.message,
      data: logicalQuestionNext,
    };
  }

  // find PlaceHold in LogicalGameResult
  async findLogicalAnswerPlaceHold(logicalGameResultId: number) {
    const logicalGameResult = await this.findLogicalGameResult(
      logicalGameResultId,
    );
    // validate check logical_game_result exit
    if (!logicalGameResult) {
      throw new BadRequestException(
        `logicalGameResult with id = ${logicalGameResultId} does not exist.`,
      );
    }
    return logicalGameResult;
  }

  async validateGameResult(
    gameResultUpdate,
    logicalGameResult: LogicalGameResult,
  ) {
    // validate check gameResult finished or paused
    if (gameResultUpdate.status === StatusGameResultEnum.FINISHED) {
      return { status: false, message: 'Game over' };
    }
    if (gameResultUpdate.status === StatusGameResultEnum.PAUSED) {
      return {
        status: false,
        message: 'Game was paused. You need to continue to play',
      };
    }
    // validate check play_time > total_game_time
    const validatePlayTime = await this.validatePlayTime(gameResultUpdate);

    if (!validatePlayTime) {
      return {
        status: false,
        message: 'Gaming time is over. End game.',
      };
    }
    // validate check index_question_answer > total_question in game
    const totalQuestionGameLogical = parseInt(
      (
        await this.gameResultService.getGameInfoByGameResult(
          gameResultUpdate.id,
        )
      ).game.total_question,
    );
    if (logicalGameResult.index > totalQuestionGameLogical) {
      return {
        status: false,
        message: 'You have completed the game. End game.',
      };
    }
    return {
      status: true,
    };
  }

  private async validatePlayTime(gameResultUpdate) {
    const newPlayTime = Date.now() - gameResultUpdate.time_start.getTime();
    const totalGameTime = (
      await this.gameResultService.getGameInfoByGameResult(gameResultUpdate.id)
    ).game.total_time;
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      return false;
    }
    return true;
  }

  async updateCorrectAnswer(gameResultUpdate, logicalResultPlaceHold) {
    const newPlayScore =
      gameResultUpdate.play_score +
      logicalResultPlaceHold.logical_question.score;
    await this.gameResultService.updateGameResultWithPlayScore(
      gameResultUpdate.id,
      newPlayScore,
    );
  }

  async checkCorrectAnswer(
    answerPlay: boolean,
    play_score: number,
    logicalGameResult: LogicalGameResult,
  ) {
    const isCorrectAnswer: boolean =
      answerPlay === logicalGameResult.logical_question.correct_answer;
    const newPlayScore = !!isCorrectAnswer
      ? play_score + logicalGameResult.logical_question.score
      : play_score;

    return {
      isCorrect: !!isCorrectAnswer,
      message: 'Your answer is ' + isCorrectAnswer,
      data: { newPlayScore },
    };
  }

  async getNextLogicalQuestion(indexQuestion: number, gameResultId: number) {
    // getLogicalGameResultByGameResult
    const logicalGameResultHistory: LogicalGameResult[] =
      await this.getHistoryAnswered(gameResultId);

    // validate except logical played and avoid 3 identical answer to get next logical_question
    const logicalExceptAndCheckIdenticalAnswer = {
      idLogicalListExcept: Object.values(logicalGameResultHistory).map(
        (obj) => obj.logical_question_id,
      ),
      checkIdenticalAnswer: Object.values(logicalGameResultHistory).map(
        (obj) => obj.logical_question.correct_answer,
      ),
    };
    const logicalQuestionRenderNext =
      await this.gameService.getLogicalQuestionRender(
        logicalExceptAndCheckIdenticalAnswer.idLogicalListExcept,
        logicalExceptAndCheckIdenticalAnswer.checkIdenticalAnswer,
      );
    const logicalGameResultRenderNext =
      await this.gameResultService.createLogicalGameResult({
        index: indexQuestion + 1,
        game_result_id: gameResultId,
        logical_question_id: logicalQuestionRenderNext.id,
        status: StatusLogicalGameResultEnum.NO_ANSWER,
        answer_play: null,
        is_correct: null,
      });
    return {
      logicalQuestionRenderNext: {
        logicalGameResultId: logicalGameResultRenderNext.id,
        logicalQuestionId: logicalQuestionRenderNext.id,
        index: logicalGameResultRenderNext.index,
        statement1: logicalQuestionRenderNext.statement1,
        statement2: logicalQuestionRenderNext.statement2,
        conclusion: logicalQuestionRenderNext.conclusion,
        score: logicalQuestionRenderNext.score,
      },
    };
  }

  async findLogicalGameResult(logicalGameResultId: number) {
    const data = await this.logicalGameResultRepository.findOne({
      where: { id: logicalGameResultId },
      relations: ['logical_question'],
    });
    return data;
  }

  async getHistoryAnswered(gameResultId: number) {
    return await this.logicalGameResultRepository.find({
      relations: ['logical_question'],
      where: { game_result_id: gameResultId },
    });
  }
}
