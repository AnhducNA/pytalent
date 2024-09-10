import { BadRequestException, Injectable } from '@nestjs/common';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { GameResult } from '@entities/gameResult.entity';
import { IcreateLogicalGameResult } from '@shared/interfaces/logicalGameResult.interface';
import { GameResultRepository } from '../repositories/gameResult.repository';
import { LogicalGameResultRepository } from '../repositories/logicalGameResult.repository';

@Injectable()
export class LogicalGameResultService {
  constructor(
    private logicalAnswerRepository: LogicalGameResultRepository,
    private gameResultRepository: GameResultRepository,
    private readonly gameService: GameService,
  ) {}

  async caculatePlayingLogical(
    id: number,
    answerPlay: boolean,
  ): Promise<{ message: string; data?: object }> {
    // find PlaceHold in LogicalGameResult
    const answerPlaceHold = await this.logicalAnswerRepository.getOne(id);

    const gameResultUpdate: GameResult = await this.gameResultRepository.getOne(
      answerPlaceHold.game_result_id,
    );

    await this.gameResultRepository.validateGameResult(
      answerPlaceHold.game_result_id,
    );

    const validateResponse = await this.validateLogicalQuestion(
      answerPlaceHold.index,
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
      answerPlaceHold.logical_question.correct_answer,
      answerPlaceHold.logical_question.score,
    );
    // update new playScore and new playTime
    await this.gameResultRepository.updatePlayTimeAndScore({
      id: gameResultUpdate.id,
      playTime: Date.now() - gameResultUpdate.time_start.getTime(),
      playScore: checkCorrectAnswer.data.newPlayScore,
    });

    // update answer in LogicalGameResult
    await this.logicalAnswerRepository.updateStatusAnswered(
      answerPlaceHold.id,
      answerPlay,
      checkCorrectAnswer.isCorrect,
    );

    // check final
    const isFinalQuestion = await this.isFinalQuestion(answerPlaceHold.index);
    if (isFinalQuestion) {
      await this.gameResultRepository.updateFinishGame(gameResultUpdate.id);
      return {
        message: 'End Game',
      };
    }

    const logicalQuestionNext = await this.getNextLogicalQuestion(
      answerPlaceHold.index,
      gameResultUpdate.id,
    );
    return {
      message: checkCorrectAnswer.message,
      data: { logicalQuestionNext },
    };
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
      message: 'success',
    };
  }
  async isFinalQuestion(indexQuestion: number): Promise<boolean> {
    // Check final logical game ==> compare index question with total question
    const totalQuestion: number =
      await this.gameService.getTotalQuestionGameLogical();
    if (indexQuestion === totalQuestion) {
      return true;
    }
    return false;
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
      logicalGameResultId: logicalGameResultRenderNext.id,
      logicalQuestionId: logicalQuestionRenderNext.id,
      index: logicalGameResultRenderNext.index,
      statement1: logicalQuestionRenderNext.statement1,
      statement2: logicalQuestionRenderNext.statement2,
      conclusion: logicalQuestionRenderNext.conclusion,
      score: logicalQuestionRenderNext.score,
    };
  }

  async findLogicalGameResult(logicalGameResultId: number) {
    const result: LogicalGameResult =
      await this.logicalAnswerRepository.findOne({
        where: { id: logicalGameResultId },
        relations: ['logical_question'],
      });
    if (!result) {
      throw new BadRequestException('Logical game result does not exit');
    }
    return result;
  }

  async getHistoryAnswered(gameResultId: number) {
    const result: LogicalGameResult[] = await this.logicalAnswerRepository.find(
      {
        relations: ['logical_question'],
        where: { game_result_id: gameResultId },
      },
    );
    return result;
  }

  async createLogicalAnswer(payload: IcreateLogicalGameResult) {
    return await this.logicalAnswerRepository.save(payload);
  }
}
