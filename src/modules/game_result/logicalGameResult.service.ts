import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameResultService } from './gameResult.service';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { GameService } from '@modules/game/game.service';

@Injectable()
export class LogicalGameResultService {
  constructor(
    @InjectRepository(LogicalGameResult)
    private gameResultService: GameResultService,
    private gameService: GameService,
  ) {}

  async handlePlayingLogical(logicalGameResultId, answerPlay) {
    const logicalGameResult = await this.validateLogicalGameResult(
      logicalGameResultId,
    );
    const gameResult = await this.gameResultService.findOne(
      logicalGameResult.game_result_id,
    );
    const logicalGameResultHistory: LogicalGameResult[] =
      await this.gameResultService.getLogicalGameResultAllByGameResult(
        gameResult.id,
      );
    const resValidateGameResult = await this.validateGameResult(
      gameResult,
      logicalGameResultHistory,
      logicalGameResult,
    );

    if (resValidateGameResult !== undefined) {
      return resValidateGameResult;
    }

    const processUserAnswer = await this.calculateAnswerOfUser(
      answerPlay,
      logicalGameResult,
      gameResult,
      logicalGameResultId,
    );
    const messageResponse = processUserAnswer.messageResponse;
    const resFinalLogicalQuestion = await this.handleFinalLogicalQuestion(
      logicalGameResult.index,
      gameResult.id,
    );
    const gameResultAfterPlay = await this.gameResultService.findOne(
      logicalGameResult.game_result_id,
    );
    if (resFinalLogicalQuestion.isFinish === true) {
      return this.responseData(
        `You answered all question. Game over.`,
        gameResultAfterPlay,
        logicalGameResultHistory,
      );
    }

    return await this.getNextLogicalQuestion(
      logicalGameResultHistory,
      logicalGameResult,
      gameResultAfterPlay,
      messageResponse,
    );
  }

  private async validateLogicalGameResult(logicalGameResultId: number) {
    const logicalGameResult =
      await this.gameResultService.getLogicalGameResultItem(
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

  private async validateGameResult(
    gameResultUpdate,
    logicalGameResultHistory,
    logicalGameResult,
  ) {
    // validate check gameResult finished or paused
    if (gameResultUpdate.status === StatusGameResultEnum.FINISHED) {
      return this.responseData(
        'Game over',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
    if (gameResultUpdate.status === StatusGameResultEnum.PAUSED) {
      return this.responseData(
        'Game was paused. You need to continue to play',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
    // validate check play_time > total_game_time
    const validatePlayTime = this.validatePlayTime(gameResultUpdate);
    if (!validatePlayTime) {
      return this.responseData(
        'Gaming time is over. End game.',
        gameResultUpdate,
        logicalGameResultHistory,
      );
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
      gameResultUpdate.status = StatusGameResultEnum.FINISHED;
      await this.gameResultService.updateGameResultWithStatus(
        gameResultUpdate.id,
        StatusGameResultEnum.FINISHED,
      );
      return this.responseData(
        'You have completed the game. End game.',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
  }

  private async validatePlayTime(gameResultUpdate) {
    const newPlayTime = Date.now() - gameResultUpdate.time_start.getTime();
    const totalGameTime = (
      await this.gameResultService.getGameInfoByGameResult(gameResultUpdate.id)
    ).game.total_time;
    await this.gameResultService.updateGameResultWithPlayTime(
      gameResultUpdate.id,
      newPlayTime,
    );
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      await this.gameResultService.updateGameResultWithStatus(
        gameResultUpdate.id,
        StatusGameResultEnum.FINISHED,
      );
      return { status: false };
    }
    return { status: true };
  }

  private async calculateAnswerOfUser(
    answerPlay,
    logicalGameResult,
    gameResultUpdate,
    logicalGameResultId,
  ) {
    const isCorrectAnswer: boolean =
      answerPlay === logicalGameResult.logical_question.correct_answer;
    // Check answer_play is true
    const messageResponse = !!isCorrectAnswer
      ? 'Your answer is true.'
      : 'Your answer is false.';
    if (!!isCorrectAnswer) {
      const newPlayScore =
        gameResultUpdate.play_score + logicalGameResult.logical_question.score;
      await this.gameResultService.updateGameResultWithPlayScore(
        gameResultUpdate.id,
        newPlayScore,
      );
    }
    // update LogicalGameResult
    await this.gameResultService.updateAnswerPlayLogicalGameResult(
      logicalGameResultId,
      StatusLogicalGameResultEnum.ANSWERED,
      answerPlay,
      isCorrectAnswer,
    );
    return {
      messageResponse,
      isCorrectAnswer,
    };
  }

  private async handleFinalLogicalQuestion(
    infexOfLogicalGameResult,
    idOfGameResult,
  ) {
    const totalQuestionGameLogical = parseInt(
      (await this.gameResultService.getGameInfoByGameResult(idOfGameResult))
        .game.total_question,
    );
    if (infexOfLogicalGameResult === totalQuestionGameLogical) {
      await this.gameResultService.updateGameResultWithStatus(
        idOfGameResult,
        StatusGameResultEnum.FINISHED,
      );
      return {
        isFinish: true,
      };
    }
    return { isFinish: false };
  }

  private async getNextLogicalQuestion(
    logicalGameResultHistory: LogicalGameResult[],
    logicalGameResult,
    gameResultUpdate,
    messageResponse,
  ) {
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
        index: logicalGameResult.index + 1,
        game_result_id: logicalGameResult.game_result_id,
        logical_question_id: logicalQuestionRenderNext.id,
        status: StatusLogicalGameResultEnum.NO_ANSWER,
        answer_play: null,
        is_correct: null,
      });
    return {
      message: messageResponse,
      data: {
        gameResult: gameResultUpdate,
        logicalQuestionRenderNext: {
          logicalGameResultId: logicalGameResultRenderNext.id,
          logicalQuestionId: logicalQuestionRenderNext.id,
          index: logicalGameResultRenderNext.index,
          statement1: logicalQuestionRenderNext.statement1,
          statement2: logicalQuestionRenderNext.statement2,
          conclusion: logicalQuestionRenderNext.conclusion,
          score: logicalQuestionRenderNext.score,
        },
      },
    };
  }
  private async responseData(message, gameResult, logicalGameResultHistory) {
    return {
      message,
      data: {
        gameResult,
        logicalGameResultHistory,
      },
    };
  }
}
