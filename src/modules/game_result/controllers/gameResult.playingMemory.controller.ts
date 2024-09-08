import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { MemoryGameResultService } from '../memoryGameResult.service';

@Controller('api/game-result-playing-memory')
export class GameResultPlayingMemoryController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
    private readonly memoryAnswerService: MemoryGameResultService,
  ) {
    super();
  }

  @Patch('memory-game-answer/:memory_game_result_id')
  @UseGuards(JwtAuthGuard)
  async playingMemoryGame(
    @Req() req: any,
    @Body()
    memoryGameResultDto: {
      answer_play: any[];
      is_correct: boolean;
    },
    @Res() res: Response,
  ) {
    const memory_game_result_id = req.params.memory_game_result_id;
    const memory_game_result_playing =
      await this.memoryAnswerService.getOneMemoryAnswer(memory_game_result_id);
    // validate check memory_game_result_playing exist
    if (!memory_game_result_playing) {
      return this.errorsResponse(
        {
          message: `Error: memory_game_result with id = ${memory_game_result_id} does not exist.`,
        },
        res,
      );
    }
    const game_result_update = await this.gameResultService.findOne(
      memory_game_result_playing.game_result_id,
    );
    const memory_game_result_history =
      await this.gameResultService.get_memory_game_result_by_game_result_id(
        game_result_update.id,
      );

    // validate check memory_game_result_playing answered
    if (
      memory_game_result_playing.answer_play &&
      memory_game_result_playing.is_correct &&
      memory_game_result_playing.memory_game.level !==
        memory_game_result_history.length
    ) {
      return this.errorsResponse(
        {
          message: `memory_game_result with id = ${memory_game_result_id} answered.`,
        },
        res,
      );
    }
    // validate check game_result status
    if (game_result_update.status === StatusGameResultEnum.FINISHED) {
      return this.errorsResponse(
        {
          message: 'Game over.',
          data: {
            game_result: game_result_update,
            memory_game_result_history: memory_game_result_history,
          },
        },
        res,
      );
    } else if (game_result_update.status === StatusGameResultEnum.PAUSED) {
      return this.errorsResponse(
        {
          message: 'Game was paused. You need to continue to play',
          data: {
            game_result: game_result_update,
            memory_game_result_history: memory_game_result_history,
          },
        },
        res,
      );
    }
    // validate check play_time > time_limit_render's level
    const play_time =
      Date.now() - memory_game_result_playing.time_start_play_level.getTime();
    if (play_time > memory_game_result_playing.memory_game.time_limit) {
      await this.gameResultService.updateGameResultWithStatus(
        memory_game_result_playing.game_result_id,
        StatusGameResultEnum.FINISHED,
      );
      return this.successResponse(
        {
          message: `Time play level ${memory_game_result_playing.memory_game.level} expired. End game.`,
          data: {
            game_result: game_result_update,
            memory_data_history: memory_game_result_history,
          },
        },
        res,
      );
    }
    try {
      // Check answer_play is true or false?
      let message_res: string;
      if (
        arraysEqualWithoutLength(
          memoryGameResultDto.answer_play,
          JSON.parse(memory_game_result_playing.correct_answer),
        ) === true
      ) {
        message_res = 'Your answer is true.';
        memoryGameResultDto.is_correct = true;
        game_result_update.play_score +=
          memory_game_result_playing.memory_game.score;
      } else {
        message_res = 'Your answer is false. End game';
        memoryGameResultDto.is_correct = false;
        await this.gameResultService.updateGameResultWithStatus(
          game_result_update.id,
          StatusGameResultEnum.FINISHED,
        );
      }
      // End check done
      // update GameResult
      await this.gameResultService.updateGameResultPlayTimeAndScore({
        id: game_result_update.id,
        playTime: Date.now() - game_result_update.time_start.getTime(),
        playScore: game_result_update.play_score,
      });
      // update memoryGameResult
      await this.memoryAnswerService.updateAnswerPlay(
        memory_game_result_id,
        JSON.stringify(memoryGameResultDto.answer_play),
        memoryGameResultDto.is_correct,
      );
      // check max level = 25
      if (memory_game_result_playing.memory_game.level >= 25) {
        await this.gameResultService.updateGameResultWithStatus(
          game_result_update.id,
          StatusGameResultEnum.FINISHED,
        );
        return this.errorsResponse(
          {
            message: 'You have completed the game. End game.',
            data: {
              game_result: game_result_update,
              memory_game_result_history:
                await this.gameResultService.get_memory_game_result_by_game_result_id(
                  game_result_update.id,
                ),
            },
          },
          res,
        );
      }
      // Return if player answer true/false?
      if (!!memoryGameResultDto.is_correct) {
        // new memoryDataRenderCurrent: next level
        const correct_answer = [];
        for (
          let i = 1;
          i <= memory_game_result_playing.memory_game.level + 1;
          i++
        ) {
          correct_answer.push(
            ['left', 'right'][
              Math.floor(Math.random() * ['left', 'right'].length)
            ],
          );
        }
        const memory_data_render_next =
          await this.gameService.getMemoryDataByLevel(
            memory_game_result_playing.memory_game.level + 1,
          );
        // Validate check if does not have data in memory_data
        if (!memory_data_render_next) {
          await this.gameResultService.updateGameResultWithStatus(
            game_result_update.id,
            StatusGameResultEnum.FINISHED,
          );
          return this.errorsResponse(
            {
              message:
                'You have not created new data in memory_data. End game.',
              data: {
                game_result: game_result_update,
                memory_game_result_history:
                  await this.gameResultService.get_memory_game_result_by_game_result_id(
                    game_result_update.id,
                  ),
              },
            },
            res,
          );
        }
        await this.memoryAnswerService.create({
          game_result_id: game_result_update.id,
          memory_game_id: memory_data_render_next.id,
          answer_play: null,
          is_correct: null,
          correct_answer: JSON.stringify(correct_answer),
          time_start_play_level: new Date(Date.now()),
        });
        const memory_game_result_render_next =
          await this.gameResultService.getFinalMemoryAnswer(
            game_result_update.id,
          );
        // END: new memoryDataRenderCurrent: next level.
        return this.successResponse(
          {
            message: message_res,
            data: {
              game_result: game_result_update,
              memory_data_render_next: {
                game_result_id: memory_game_result_render_next.game_result_id,
                memory_game_result_id: memory_game_result_render_next.id,
                memory_game_id: memory_game_result_render_next.memory_game_id,
                level: memory_game_result_render_next.memory_game.level,
                score: memory_game_result_render_next.memory_game.score,
                time_render:
                  memory_game_result_render_next.memory_game.time_limit,
                correct_answer: JSON.parse(
                  memory_game_result_render_next.correct_answer,
                ),
                time_start_play_level:
                  memory_game_result_render_next.time_start_play_level,
              },
            },
          },
          res,
        );
      } else {
        return this.errorsResponse(
          {
            message: message_res,
            data: {
              game_result: game_result_update,
              memory_game_result_history:
                await this.gameResultService.get_memory_game_result_by_game_result_id(
                  game_result_update.id,
                ),
            },
          },
          res,
        );
      }
    } catch (e) {
      return this.errorsResponse(
        {
          message: 'Error play memory game.',
          data: e,
        },
        res,
      );
    }
  }
}
function arraysEqualWithoutLength(a: any[], b: any[]) {
  if (a == null || b == null) return false;
  if (a.length <= b.length) {
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
  } else {
    for (let i = 0; i < b.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
  }
  return true;
}
