import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';

@Controller('api/game-result-playing-logical')
export class GameResultPlayingLogicalController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  @Patch('logical-game-answer/:logicalGameResultId')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Req() req: any,
    @Body()
    logicalGameAnswerDto: {
      answerPlay: boolean;
      isCorrect: boolean | null;
    },
    @Res() res: Response,
  ) {
    const logicalGameResultId = req.params.logicalGameResultId;
    const logicalGameResult =
      await this.gameResultService.getLogicalGameResultItem(
        logicalGameResultId,
      );
    // validate check logical_game_result exit
    if (!logicalGameResult) {
      return this.errorsResponse(
        {
          message: `logical_game_result with id = ${logicalGameResultId} does not exist.`,
        },
        res,
      );
    }
    // validate check logical_game_result was answered
    if (logicalGameResult.status === StatusLogicalGameResultEnum.ANSWERED) {
      return this.errorsResponse(
        {
          message: `logical_game_result with id = ${logicalGameResultId} was answered.`,
        },
        res,
      );
    }
    const gameResultUpdate = await this.gameResultService.findOne(
      logicalGameResult.game_result_id,
    );
    const logicalGameResultHistory: LogicalGameResult[] =
      await this.gameResultService.getLogicalGameResultAllByGameResult(
        gameResultUpdate.id,
      );

    // validate check game_result finished or paused
    if (gameResultUpdate.status === StatusGameResultEnum.FINISHED) {
      return this.responseErrorLogicalGame(
        res,
        'Game over',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
    if (gameResultUpdate.status === StatusGameResultEnum.PAUSED) {
      return this.responseErrorLogicalGame(
        res,
        'Game was paused. You need to continue to play',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
    // validate check play_time > total_game_time
    gameResultUpdate.play_time =
      Date.now() - gameResultUpdate.time_start.getTime();
    const totalGameTime = (
      await this.gameResultService.getGameInfoByGameResult(gameResultUpdate.id)
    ).game.total_time;
    if (gameResultUpdate.play_time > totalGameTime) {
      // when the game time is up, set done for game_result
      gameResultUpdate.status = StatusGameResultEnum.FINISHED;
      await this.gameResultService.update_game_result_status(
        gameResultUpdate.id,
        StatusGameResultEnum.FINISHED,
      );
      return this.responseErrorLogicalGame(
        res,
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
      await this.gameResultService.update_game_result_status(
        gameResultUpdate.id,
        StatusGameResultEnum.FINISHED,
      );
      return this.responseErrorLogicalGame(
        res,
        'You have completed the game. End game.',
        gameResultUpdate,
        logicalGameResultHistory,
      );
    }
    const processUserAnswer: {
      messageResponse: any;
      logicalGameAnswerDto: any;
      gameResultUpdate: any;
    } = await this.processUserAnswer(
      logicalGameAnswerDto,
      logicalGameResult,
      gameResultUpdate,
      logicalGameResultId,
    );
    const messageResponse = processUserAnswer.messageResponse;
    logicalGameAnswerDto = processUserAnswer.logicalGameAnswerDto;
    const gameResultUpdateAfterPlay = processUserAnswer.gameResultUpdate;

    // validate check final logical_question of total
    if (logicalGameResult.index === totalQuestionGameLogical) {
      gameResultUpdateAfterPlay.status = StatusGameResultEnum.FINISHED;
      return await this.handleFinalLogicalQuestion(
        gameResultUpdateAfterPlay,
        logicalGameResultHistory,
        logicalGameResult.index,
        totalQuestionGameLogical,
        res,
      );
    }
    // validate check answer question skip
    if (logicalGameResult.index < logicalGameResultHistory.length) {
      return this.successResponse(
        {
          message: messageResponse,
          data: {
            game_result: gameResultUpdateAfterPlay,
          },
        },
        res,
      );
    }

    const nextLogicalQuestionResponse = await this.getNextLogicalQuestion(
      logicalGameResultHistory,
      logicalGameResult,
      gameResultUpdateAfterPlay,
      messageResponse,
      res,
    );
    return nextLogicalQuestionResponse;
  }

  private async handleFinalLogicalQuestion(
    gameResultUpdateAfterPlay,
    logicalGameResultHistory,
    questionAnswered: number,
    totalQuestion: number,
    res,
  ) {
    await this.gameResultService.update_game_result_status(
      gameResultUpdateAfterPlay.id,
      StatusGameResultEnum.FINISHED,
    );
    return this.successResponse(
      {
        message: `You answered ${questionAnswered} / ${totalQuestion} question. Game over.`,
        data: {
          gameResult: gameResultUpdateAfterPlay,
          logicalGameResultHistory: logicalGameResultHistory,
        },
      },
      res,
    );
  }
  private async processUserAnswer(
    logicalGameAnswerDto,
    logicalGameResult,
    gameResultUpdate,
    logicalGameResultId,
  ) {
    // Check answer_play is true
    const messageResponse =
      logicalGameAnswerDto.answerPlay ===
      logicalGameResult.logical_question.correct_answer
        ? 'Your answer is true.'
        : 'Your answer is false.';

    if (
      logicalGameAnswerDto.answerPlay ===
      logicalGameResult.logical_question.correct_answer
    ) {
      logicalGameAnswerDto.isCorrect = true;
      gameResultUpdate.play_score += logicalGameResult.logical_question.score;
    } else {
      logicalGameAnswerDto.isCorrect = false;
    }
    // updateGameResult
    await this.gameResultService.updateGameResult(gameResultUpdate);
    // update LogicalGameResult
    await this.gameResultService.update_answer_play_logical_game_result(
      logicalGameResultId,
      StatusLogicalGameResultEnum.ANSWERED,
      logicalGameAnswerDto.answerPlay,
      logicalGameAnswerDto.isCorrect,
    );
    return {
      messageResponse,
      logicalGameAnswerDto,
      gameResultUpdate,
    };
  }

  private async getNextLogicalQuestion(
    logicalGameResultHistory: LogicalGameResult[],
    logicalGameResult,
    gameResultUpdate,
    messageResponse,
    res,
  ) {
    try {
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
      return this.successResponse(
        {
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
        },
        res,
      );
    } catch (error) {
      return this.errorsResponse(
        {
          message: 'Error',
          data: error,
        },
        res,
      );
    }
  }
  async responseErrorLogicalGame(
    res: Response,
    message,
    gameResultUpdate,
    logicalGameResultHistory,
  ) {
    // validate check game_result finished or paused
    return this.errorsResponse(
      {
        message: message,
        data: {
          gameResult: gameResultUpdate,
          logicalGameResultHistory: logicalGameResultHistory,
        },
      },
      res,
    );
  }
}
