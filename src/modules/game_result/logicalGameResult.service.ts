import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Repository } from 'typeorm';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { ResponseInterface } from '@shared/interfaces/response.interface';
import { GameResult } from '@entities/gameResult.entity';
import { IcreateLogicalGameResult } from '@shared/interfaces/logicalGameResult.interface';
import { GameResultRepository } from './repositories/gameResult.repository';

@Injectable()
export class LogicalGameResultService {
  constructor(
    @InjectRepository(LogicalGameResult)
    private readonly logicalGameResultRepository: Repository<LogicalGameResult>,
    private gameResultRepository: GameResultRepository,
    private readonly gameService: GameService,
  ) {}

  async caculatePlayingLogical(
    id: number,
    answerPlay: boolean,
  ): Promise<ResponseInterface> {
    // get logical_game_result place hold
    const logicalAnswerPlaceHold = await this.findLogicalAnswerPlaceHold(id);

    const gameResultUpdate: GameResult =
      await this.gameResultRepository.findAndValidateGameResult(
        logicalAnswerPlaceHold.game_result_id,
      );

    const validateResponse = await this.validateLogicalQuestion(
      logicalAnswerPlaceHold.index,
    );
    // have validate => end game
    if (validateResponse.status === false) {
      await this.gameResultRepository.updateFinishGame(gameResultUpdate.id);
      return { message: validateResponse.message };
    }

    // check logical answer is true or false
    const checkCorrectAnswer = await this.checkCorrectAnswer(
      answerPlay,
      gameResultUpdate.play_score,
      logicalAnswerPlaceHold.logical_question.correct_answer,
      logicalAnswerPlaceHold.logical_question.score,
    );
    // update new playScore and new playTime
    await this.gameResultRepository.updatePlayTimeAndScore({
      id: gameResultUpdate.id,
      playTime: Date.now() - gameResultUpdate.time_start.getTime(),
      playScore: checkCorrectAnswer.data.newPlayScore,
    });

    // update answer in LogicalGameResult
    await this.updateLogicalAnswered(
      logicalAnswerPlaceHold.id,
      answerPlay,
      checkCorrectAnswer.isCorrect,
    );

    await this.updateFinalQuestion(
      logicalAnswerPlaceHold.index,
      gameResultUpdate.id,
    );

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

  async validateLogicalQuestion(indexQuestion: number) {
    // validate check index_question_answer > total_question in game
    const totalQuestion: number =
      await this.gameService.getTotalQuestionGameLogical();
    if (indexQuestion > totalQuestion) {
      return {
        status: false,
        message: 'You have completed the game. End game.',
      };
    }
    return {
      status: true,
    };
  }

  async updateFinalQuestion(indexQuestion: number, gameResultId: number) {
    // Check final logical game ==> compare index question with total question
    const totalQuestion: number =
      await this.gameService.getTotalQuestionGameLogical();
    if (indexQuestion === totalQuestion) {
      await this.gameResultRepository.updateFinishGame(gameResultId);
      return {
        message: 'End Game',
      };
    }
  }

  async checkCorrectAnswer(
    answerPlay: boolean,
    play_score: number,
    correctAnswer: boolean,
    scoreQuestion: number,
  ) {
    const isCorrectAnswer: boolean = answerPlay === correctAnswer;
    const newPlayScore = !!isCorrectAnswer
      ? play_score + scoreQuestion
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
    const logicalGameResultRenderNext = await this.createLogicalAnswer({
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
    const result: LogicalGameResult =
      await this.logicalGameResultRepository.findOne({
        where: { id: logicalGameResultId },
        relations: ['logical_question'],
      });
    return result;
  }

  async getHistoryAnswered(gameResultId: number) {
    const result: LogicalGameResult[] =
      await this.logicalGameResultRepository.find({
        relations: ['logical_question'],
        where: { game_result_id: gameResultId },
      });
    return result;
  }

  async updateLogicalAnswered(
    logical_game_result_id: number,
    answer_play: boolean,
    is_correct: boolean,
  ) {
    return await this.logicalGameResultRepository
      .createQueryBuilder()
      .update(LogicalGameResult)
      .set({
        status: StatusLogicalGameResultEnum.ANSWERED,
        answer_play: answer_play,
        is_correct: is_correct,
      })
      .where('id = :id', { id: logical_game_result_id })
      .execute();
  }

  async createLogicalAnswer(payload: IcreateLogicalGameResult) {
    return await this.logicalGameResultRepository.save(payload);
  }

  async getLogicalAnswerFinalByGameResult(gameResultId: number) {
    return this.logicalGameResultRepository.findOne({
      relations: ['logical_game_result'],
      where: { game_result_id: gameResultId },
      order: { game_result_id: 'DESC' },
    });
  }
}
