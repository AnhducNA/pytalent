import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';

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
    const logicalGameResultHistory =
      await this.gameResultService.get_logical_game_result_all_by_game_result(
        gameResultUpdate.id,
      );
    // validate check game_result finished or paused
    if (gameResultUpdate.status === StatusGameResultEnum.FINISHED) {
      return this.errorsResponse(
        {
          message: 'Game over.',
          data: {
            gameResult: gameResultUpdate,
            logical_game_result_history: logicalGameResultHistory,
          },
        },
        res,
      );
    } else if (gameResultUpdate.status === StatusGameResultEnum.PAUSED) {
      return this.errorsResponse(
        {
          message: 'Game was paused. You need to continue to play',
          data: {
            game_result: gameResultUpdate,
            logical_game_result_history: logicalGameResultHistory,
          },
        },
        res,
      );
    }
    // validate check play_time > total_game_time
    gameResultUpdate.play_time =
      Date.now() - gameResultUpdate.time_start.getTime();
    const totalGameTime = (
      await this.gameResultService.get_game_info_by_game_result(
        gameResultUpdate.id,
      )
    ).game.total_time;
    if (gameResultUpdate.play_time > totalGameTime) {
      // when the game time is up, set done for game_result
      gameResultUpdate.status = StatusGameResultEnum.FINISHED;
      await this.gameResultService.update_game_result_status(
        gameResultUpdate.id,
        StatusGameResultEnum.FINISHED,
      );
      return this.errorsResponse(
        {
          message: 'Gaming time is over. End game.',
          data: {
            game_result: gameResultUpdate,
            logical_game_result_history: logicalGameResultHistory,
          },
        },
        res,
      );
    }
    // validate check index_question_answer > total_question in game
    const totalQuestionGameLogical = parseInt(
      (
        await this.gameResultService.get_game_info_by_game_result(
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
      return this.errorsResponse(
        {
          message: 'You have completed the game. End game.',
          data: {
            game_result: gameResultUpdate,
            logical_game_result_history: logicalGameResultHistory,
          },
        },
        res,
      );
    }
    let message_res = '';
    try {
      // Check answer_play is true
      if (
        logicalGameAnswerDto.answerPlay ===
        logicalGameResult.logical_question.correct_answer
      ) {
        message_res = 'Your answer is true.';
        logicalGameAnswerDto.isCorrect = true;
        gameResultUpdate.play_score += logicalGameResult.logical_question.score;
      } else {
        message_res = 'Your answer is false';
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
      // validate check final logical_question of total
      if (logicalGameResult.index === totalQuestionGameLogical) {
        gameResultUpdate.status = StatusGameResultEnum.FINISHED;
        await this.gameResultService.update_game_result_status(
          gameResultUpdate.id,
          StatusGameResultEnum.FINISHED,
        );
        return this.successResponse(
          {
            message: `You answered ${logicalGameResult.index} / ${totalQuestionGameLogical} question. Game over.`,
            data: {
              game_result: gameResultUpdate,
              logical_game_result_history: logicalGameResultHistory,
            },
          },
          res,
        );
      }
      // validate check answer question skip
      if (logicalGameResult.index < logicalGameResultHistory.length) {
        return this.successResponse(
          {
            message: message_res,
            data: {
              game_result: gameResultUpdate,
            },
          },
          res,
        );
      }
      // validate except logical played and avoid 3 identical answer to get next logical_question
      const logicalExceptAndCheckIdenticalAnswer = {
        id_logical_list_except: Object.values(logicalGameResultHistory).map(
          (obj) => obj.logical_question_id,
        ),
        check_identical_answer: Object.values(logicalGameResultHistory).map(
          (obj) => obj.logical_question.correct_answer,
        ),
      };
      const logicalQuestionRenderNext =
        await this.gameService.getLogicalQuestionRender(
          logicalExceptAndCheckIdenticalAnswer.id_logical_list_except,
          logicalExceptAndCheckIdenticalAnswer.check_identical_answer,
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
          message: message_res,
          data: {
            game_result: gameResultUpdate,
            logical_question_render_next: {
              logical_game_result_id: logicalGameResultRenderNext.id,
              logical_question_id: logicalQuestionRenderNext.id,
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
    } catch (e) {
      return this.errorsResponse(
        {
          message: 'Error 123',
          data: e,
        },
        res,
      );
    }
  }
}
