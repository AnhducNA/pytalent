import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';

@Controller('api/game-result-playing-logical')
export class GameResultPlayingLogicalController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  @Patch('logical-game-answer/:logical_game_result_id')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Req() req: any,
    @Body()
    logicalGameAnswerDto: {
      answer_play: boolean;
      is_correct: boolean | null;
    },
    @Res() res: Response,
  ) {
    const logical_game_result_id = req.params.logical_game_result_id;
    const logical_game_result =
      await this.gameResultService.get_logical_game_result_item(
        logical_game_result_id,
      );
    // validate check logical_game_result exit
    if (!logical_game_result) {
      return this.errorsResponse(
        {
          message: `logical_game_result with id = ${logical_game_result_id} does not exist.`,
        },
        res,
      );
    }
    // validate check logical_game_result was answered
    if (logical_game_result.status === StatusLogicalGameResultEnum.ANSWERED) {
      return this.errorsResponse(
        {
          message: `logical_game_result with id = ${logical_game_result_id} was answered.`,
        },
        res,
      );
    }
    const game_result_update = await this.gameResultService.findOne(
      logical_game_result.game_result_id,
    );
    const logical_game_result_history =
      await this.gameResultService.get_logical_game_result_all_by_game_result(
        game_result_update.id,
      );
    // validate check game_result is_done
    if (game_result_update.is_done === true) {
      return this.errorsResponse(
        {
          message: 'Game over.',
          data: {
            game_result: game_result_update,
            logical_game_result_history: logical_game_result_history,
          },
        },
        res,
      );
    }
    // validate check play_time > total_game_time
    game_result_update.play_time =
      Date.now() - game_result_update.time_start.getTime();
    const total_game_time = parseInt(
      (
        await this.gameResultService.get_game_info_by_game_result(
          game_result_update.id,
        )
      ).game.total_time,
    );
    if (game_result_update.play_time > total_game_time) {
      // when the game time is up, set done for game_result
      game_result_update.is_done = true;
      await this.gameResultService.updateIsDoneGameResult(
        game_result_update.id,
      );
      return this.errorsResponse(
        {
          message: 'Gaming time is over. End game.',
          data: {
            game_result: game_result_update,
            logical_game_result_history: logical_game_result_history,
          },
        },
        res,
      );
    }
    // validate check index_question_answer > total_question in game
    const total_question_game_logical = parseInt(
      (
        await this.gameResultService.get_game_info_by_game_result(
          game_result_update.id,
        )
      ).game.total_question,
    );
    if (logical_game_result.index > total_question_game_logical) {
      game_result_update.is_done = true;
      await this.gameResultService.updateIsDoneGameResult(
        game_result_update.id,
      );
      return this.errorsResponse(
        {
          message: 'You have completed the game. End game.',
          data: {
            game_result: game_result_update,
            logical_game_result_history: logical_game_result_history,
          },
        },
        res,
      );
    }
    let message_res = '';
    try {
      // Check answer_play is true
      if (
        logicalGameAnswerDto.answer_play ===
        logical_game_result.logical_question.correct_answer
      ) {
        message_res = 'Your answer is true.';
        logicalGameAnswerDto.is_correct = true;
        game_result_update.play_score +=
          logical_game_result.logical_question.score;
      } else {
        message_res = 'Your answer is false';
        logicalGameAnswerDto.is_correct = false;
      }
      // updateGameResult
      await this.gameResultService.updateGameResult(game_result_update);
      // update LogicalGameResult
      await this.gameResultService.update_answer_play_logical_game_result(
        logical_game_result_id,
        StatusLogicalGameResultEnum.ANSWERED,
        logicalGameAnswerDto.answer_play,
        logicalGameAnswerDto.is_correct,
      );
      // validate check final logical_question of total
      if (logical_game_result.index === total_question_game_logical) {
        game_result_update.is_done = true;
        await this.gameResultService.updateIsDoneGameResult(
          game_result_update.id,
        );
        return this.successResponse(
          {
            message: `You answered ${logical_game_result.index} / ${total_question_game_logical} question. Game over.`,
            data: {
              game_result: game_result_update,
              logical_game_result_history: logical_game_result_history,
            },
          },
          res,
        );
      }
      // validate check answer question skip
      if (logical_game_result.index < logical_game_result_history.length) {
        return this.successResponse(
          {
            message: message_res,
            data: {
              game_result: game_result_update,
            },
          },
          res,
        );
      }
      // validate except logical played and avoid 3 identical answer to get next logical_question
      const logical_except_and_check_identical_answer = {
        id_logical_list_except: Object.values(logical_game_result_history).map(
          (obj) => obj.logical_question_id,
        ),
        check_identical_answer: Object.values(logical_game_result_history).map(
          (obj) => obj.logical_question.correct_answer,
        ),
      };
      const logical_question_render_next =
        await this.gameService.getLogicalQuestionRender(
          logical_except_and_check_identical_answer.id_logical_list_except,
          logical_except_and_check_identical_answer.check_identical_answer,
        );
      const logical_game_result_render_next =
        await this.gameResultService.createLogicalGameResult({
          index: logical_game_result.index + 1,
          game_result_id: logical_game_result.game_result_id,
          logical_question_id: logical_question_render_next.id,
          status: StatusLogicalGameResultEnum.NO_ANSWER,
          answer_play: null,
          is_correct: null,
        });
      return this.successResponse(
        {
          message: message_res,
          data: {
            game_result: game_result_update,
            logical_question_render_next: {
              logical_game_result_id: logical_game_result_render_next.id,
              logical_question_id: logical_question_render_next.id,
              index: logical_game_result_render_next.index,
              statement1: logical_question_render_next.statement1,
              statement2: logical_question_render_next.statement2,
              conclusion: logical_question_render_next.conclusion,
              score: logical_question_render_next.score,
            },
          },
        },
        res,
      );
    } catch (e) {
      console.log(e);
    }
  }
}
