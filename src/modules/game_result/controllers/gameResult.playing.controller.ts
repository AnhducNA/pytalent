import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { CreateGameResultDto } from '@modules/game_result/createGameResult.dto';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { AssessmentService } from '@modules/assessment/assessment.service';
import { LogicalGameResultService } from '../logicalGameResult.service';

@Controller('api/game-result-playing')
export class GameResultPlayingController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
    private readonly assessmentService: AssessmentService,
    private readonly logicalGameResultService: LogicalGameResultService,
  ) {
    super();
  }

  //  Start playing game
  @Post('play')
  @UseGuards(JwtAuthGuard)
  async startPlayingGame(
    @Req() req: any,
    @Body()
    gameResultDto: CreateGameResultDto,
    @Res() res: Response,
  ) {
    // set candidate_id for gameResultDto
    const userLogin = req['userLogin'];
    gameResultDto.candidate_id = userLogin.id;
    // validate check assessment time_end
    const assessment_time_end = (
      await this.assessmentService.getOne(gameResultDto.assessment_id)
    ).time_end;
    if (Date.now() - assessment_time_end.getTime() > 0) {
      return this.errorsResponse(
        {
          message: `Assessment has expired. Time end: ${assessment_time_end}. Login with: ${userLogin.email}.`,
        },
        res,
      );
    }
    // validate check assessment contain Candidate?
    const assessmentCheckCandidate =
      await this.assessmentService.getOneAssessmentCandidate(
        gameResultDto.assessment_id,
        userLogin.id,
      );
    if (!assessmentCheckCandidate) {
      return this.errorsResponse(
        {
          message: `Assessment does not have candidate: ${userLogin.email}.`,
        },
        res,
      );
    }

    // check start/ continue/ end of game_result
    const game_result_exist_check =
      await this.gameResultService.get_game_result_exist_check(
        gameResultDto.candidate_id,
        gameResultDto.assessment_id,
        gameResultDto.game_id,
      );
    // Nếu có game_result_exist_check => Kết thúc/ Tiếp tục.
    // Nếu không có game_result_exist_check => Tạo mới trò chơi.
    if (game_result_exist_check?.status === StatusGameResultEnum.FINISHED) {
      //   Game over
      return this.successResponse(
        {
          message: 'Game Over.',
          data: await this.gameResultService.get_history_type_game_result_by_game_result(
            game_result_exist_check.id,
          ),
        },
        res,
      );
    } else if (
      game_result_exist_check?.status === StatusGameResultEnum.PAUSED ||
      game_result_exist_check?.status === StatusGameResultEnum.STARTED
    ) {
      // continue play game_result
      const time_start = new Date(
        Date.now() - game_result_exist_check.play_time,
      );
      await this.gameResultService.updateTimeStartGameResult(
        game_result_exist_check.id,
        time_start,
      );
      game_result_exist_check.status = StatusGameResultEnum.STARTED;
      await this.gameResultService.updateGameResultWithStatus(
        game_result_exist_check.id,
        StatusGameResultEnum.STARTED,
      );
      switch (gameResultDto?.game_id) {
        case 1:
          // Candidate continue play logicalQuestion
          // validate check end play_time
          if (game_result_exist_check.play_time > 90000) {
            await this.gameResultService.updateGameResultWithStatus(
              game_result_exist_check.id,
              StatusGameResultEnum.FINISHED,
            );
            return this.errorsResponse(
              {
                message: 'You have run out of logical game time',
                data: await this.gameResultService.get_history_type_game_result_by_game_result(
                  game_result_exist_check.id,
                ),
              },
              res,
            );
          }
          try {
            const logical_game_result_final_by_game_result =
              await this.gameResultService.getLogicalGameResultFinalByGameResult(
                game_result_exist_check.id,
              );
            return this.successResponse(
              {
                message: 'Continue play game logical success.',
                data: {
                  game_result: game_result_exist_check,
                  logical_question_render_current: {
                    logical_game_result_id:
                      logical_game_result_final_by_game_result.id,
                    logical_question_id:
                      logical_game_result_final_by_game_result.logical_question_id,
                    index: logical_game_result_final_by_game_result.index,
                    statement1:
                      logical_game_result_final_by_game_result.logical_question
                        .statement1,
                    statement2:
                      logical_game_result_final_by_game_result.logical_question
                        .statement2,
                    conclusion:
                      logical_game_result_final_by_game_result.logical_question
                        .conclusion,
                    score:
                      logical_game_result_final_by_game_result.logical_question
                        .score,
                  },
                },
              },
              res,
            );
          } catch (e) {
            return this.errorsResponse(
              {
                message: 'Continue play game logical fail.',
                data: e,
              },
              res,
            );
          }
        case 2:
          // Candidate play memoryGame
          try {
            const memory_game_result_final =
              await this.gameResultService.get_memory_game_result_final_by_game_result(
                game_result_exist_check.id,
              );
            let correct_answer = [];
            for (
              let i = 1;
              i <= memory_game_result_final.memory_game.level;
              i++
            ) {
              correct_answer = [
                ...correct_answer,
                ['left', 'right'][
                  Math.floor(Math.random() * ['left', 'right'].length)
                ],
              ];
            }
            await this.gameResultService.update_memory_game_result_correct_answer_by_id(
              memory_game_result_final.id,
              JSON.stringify(correct_answer),
            );
            await this.gameResultService.update_memory_game_result_time_start_play_level_final_by_id(
              memory_game_result_final.id,
            );
            return this.successResponse(
              {
                message: 'Continue play game memory success.',
                data: {
                  game_result: {
                    id: game_result_exist_check.id,
                    play_time: game_result_exist_check.play_time,
                    play_score: game_result_exist_check.play_score,
                    status: game_result_exist_check.status,
                    time_start: game_result_exist_check.time_start,
                  },
                  memory_game_render_current: {
                    game_result_id: memory_game_result_final.game_result_id,
                    memory_game_result_id: memory_game_result_final.id,
                    memory_game_id: memory_game_result_final.memory_game_id,
                    level: memory_game_result_final.memory_game.level,
                    score: memory_game_result_final.memory_game.score,
                    time_render:
                      memory_game_result_final.memory_game.time_limit,
                    correct_answer: correct_answer,
                  },
                },
              },
              res,
            );
          } catch (e) {
            return this.errorsResponse(
              {
                message: 'Continue play game memory fail.',
                data: e,
              },
              res,
            );
          }
        default:
          // validate check if game_id does not setting.
          return this.errorsResponse(
            {
              message: `Game with id = ${gameResultDto.game_id} does not setting.`,
            },
            res,
          );
      }
    } else {
      //   New game_result: Start play game: create new game_result
      // Default value game_result before add new
      gameResultDto.play_time = 0;
      gameResultDto.play_score = 0;
      gameResultDto.status = StatusGameResultEnum.STARTED;
      gameResultDto.time_start = new Date(Date.now());
      const game_result_new = await this.gameResultService.create(
        gameResultDto,
      );
      // Get Data game
      switch (gameResultDto?.game_id) {
        case 1:
          try {
            // Candidate start play logicalQuestion
            const logical_question_render_next =
              await this.gameService.getLogicalQuestionRender([], []);
            // create logical_game_result
            const logical_game_result_new =
              await this.logicalGameResultService.createLogicalAnswer({
                index: 1,
                game_result_id: game_result_new.id,
                logical_question_id: logical_question_render_next.id,
                status: StatusLogicalGameResultEnum.NO_ANSWER,
                answer_play: null,
                is_correct: null,
              });
            return this.successResponse(
              {
                message: 'Start play game logical success.',
                data: {
                  game_result: {
                    id: game_result_new.id,
                    play_time: game_result_new.play_time,
                    play_score: game_result_new.play_score,
                    status: game_result_new.status,
                    time_start: game_result_new.time_start,
                  },
                  logical_question_render_next: {
                    logical_game_result_id: logical_game_result_new.id,
                    logical_question_id: logical_question_render_next.id,
                    index: 1,
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
            return this.errorsResponse(
              {
                message: 'Error start play logical game',
                data: e,
              },
              res,
            );
          }
        case 2:
          // Candidate start play memoryGame
          try {
            const correct_answer = [
              ['left', 'right'][
                Math.floor(Math.random() * ['left', 'right'].length)
              ],
            ];
            await this.gameResultService.createMemoryGameResult({
              game_result_id: game_result_new.id,
              memory_game_id: (
                await this.gameService.getMemoryDataByLevel(1)
              ).id,
              correct_answer: JSON.stringify(correct_answer),
              answer_play: null,
              is_correct: null,
              time_start_play_level: new Date(Date.now()),
            });
            const memory_game_result_final_by_game_result =
              await this.gameResultService.get_memory_game_result_final_by_game_result(
                game_result_new.id,
              );
            return this.successResponse(
              {
                message: 'Start play game memory success.',
                data: {
                  game_result: game_result_new,
                  memory_data_render_next: {
                    game_result_id:
                      memory_game_result_final_by_game_result.game_result_id,
                    memory_game_result_id:
                      memory_game_result_final_by_game_result.id,
                    memory_game_id:
                      memory_game_result_final_by_game_result.memory_game_id,
                    level:
                      memory_game_result_final_by_game_result.memory_game.level,
                    score:
                      memory_game_result_final_by_game_result.memory_game.score,
                    time_render:
                      memory_game_result_final_by_game_result.memory_game
                        .time_limit,
                    correct_answer: JSON.parse(
                      memory_game_result_final_by_game_result.correct_answer,
                    ),
                    time_start_play_level:
                      memory_game_result_final_by_game_result.time_start_play_level,
                  },
                },
              },
              res,
            );
          } catch (e) {
            return this.errorsResponse(
              {
                message: 'Error start play memory game',
                data: e,
              },
              res,
            );
          }
        default:
          // validate check if game_id does not setting.
          return this.errorsResponse(
            {
              message: `Game with id = ${gameResultDto.game_id} does not setting.`,
            },
            res,
          );
      }
    }
  }

  @Get('pause/:game_result_id')
  async exitGame(@Req() req: any, @Res() res: Response) {
    const game_result_id = req.params.game_result_id;
    const game_result_detail = await this.gameResultService.findOne(
      game_result_id,
    );
    const play_time = Date.now() - game_result_detail.time_start.getTime();
    await this.gameResultService.updateGameResultWithPlayTime(
      game_result_id,
      play_time,
    );
    await this.gameResultService.updateGameResultWithStatus(
      game_result_id,
      StatusGameResultEnum.PAUSED,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Pause game success.',
      data: await this.gameResultService.get_history_type_game_result_by_game_result(
        game_result_id,
      ),
    });
  }

  @Get('end/:game_result_id')
  async endPlayGame(@Req() req: any, @Res() res: Response) {
    try {
      const game_result_id = req.params.game_result_id;
      await this.gameResultService.updateGameResultWithStatus(
        game_result_id,
        StatusGameResultEnum.FINISHED,
      );
      return res.status(HttpStatus.OK).json({
        message: 'End game success.',
        data: await this.gameResultService.get_history_type_game_result_by_game_result(
          game_result_id,
        ),
      });
    } catch (e) {
      console.log(e.message);
    }
  }
}
