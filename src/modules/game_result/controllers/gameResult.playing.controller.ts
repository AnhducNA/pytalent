import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { arraysEqualWithoutLength } from '@helper/function';
import { CreateGameResultDto } from '@modules/game_result/createGameResult.dto';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';

@Controller('api/game-result-playing')
export class GameResultPlayingController extends BaseController {
  private _timeStart: number;
  private _timeNextMemoryItem: number;
  private _gameResultPlaying: {
    id: number;
    candidate_id: number;
    assessment_id: number;
    game_id: number;
    play_time: number;
    play_score: number;
    is_done: boolean;
  };
  private _memoryDataRenderCurrent: {
    id: number;
    level: number;
    time_limit: number;
    score: number;
    correct_answer: any[];
  };

  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  get timeStart(): number {
    return this._timeStart;
  }

  set timeStart(value: number) {
    this._timeStart = value;
  }

  get timeNextMemoryItem(): number {
    return this._timeNextMemoryItem;
  }

  set timeNextMemoryItem(value: number) {
    this._timeNextMemoryItem = value;
  }

  get gameResultPlaying(): {
    id: number;
    candidate_id: number;
    assessment_id: number;
    game_id: number;
    play_time: number;
    play_score: number;
    is_done: boolean;
  } {
    return this._gameResultPlaying;
  }

  set gameResultPlaying(value: {
    id: number;
    candidate_id: number;
    assessment_id: number;
    game_id: number;
    play_time: number;
    play_score: number;
    is_done: boolean;
  }) {
    this._gameResultPlaying = value;
  }

  get memoryDataRenderCurrent(): {
    id: number;
    level: number;
    time_limit: number;
    score: number;
    correct_answer: any[];
  } {
    return this._memoryDataRenderCurrent;
  }

  set memoryDataRenderCurrent(value: {
    id: number;
    level: number;
    time_limit: number;
    score: number;
    correct_answer: any[];
  }) {
    this._memoryDataRenderCurrent = value;
  }

  //  Continue playing game
  // @Get('continue_playing_game_result/:game_result_id')
  // @UseGuards(JwtAuthGuard)
  // async continuePlayingGameResult(@Req() req: any, @Res() res: Response) {}

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
      await this.gameResultService.get_assessment_by_id(
        gameResultDto.assessment_id,
      )
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
      await this.gameResultService.findOneAssessmentCandidate(
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
    // validate check if game_id does not setting.
    if (gameResultDto.game_id > 2) {
      return this.errorsResponse(
        {
          message: `Game with id = ${gameResultDto.game_id} does not setting.`,
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
    if (game_result_exist_check?.is_done === true) {
      //   Game over
      return this.successResponse(
        {
          message: 'Game Over.',
        },
        res,
      );
    } else if (game_result_exist_check?.is_done === false) {
      // continue play game_result
      const time_start = new Date(
        Date.now() - game_result_exist_check.play_time,
      );
      await this.gameResultService.updateTimeStartGameResult(
        game_result_exist_check.id,
        time_start,
      );
      switch (gameResultDto?.game_id) {
        case 1:
          // Candidate play logicalQuestion
          try {
            const logical_game_result_final_by_game_result =
              await this.gameResultService.get_logical_game_result_final_by_game_result(
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
            return this.successResponse(
              {
                message: 'Continue play game logical success.',
                data: {
                  game_result: game_result_exist_check,
                  memory_game_render_current: {
                    game_result_id: memory_game_result_final.game_result_id,
                    memory_game_result_id: memory_game_result_final.id,
                    memory_game_id: memory_game_result_final.memory_game_id,
                    level: memory_game_result_final.memory_game.level,
                    score: memory_game_result_final.memory_game.score,
                    time_limit: memory_game_result_final.memory_game.time_limit,
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
          return this.errorsResponse(
            {
              message: 'You are not allowed to play this game.',
              data: {
                game_result: this.gameResultPlaying,
              },
            },
            res,
          );
      }
    } else {
      //   New game_result: Start play game: create new game_result
      // Default value game_result before add new
      gameResultDto.play_time = 0;
      gameResultDto.play_score = 0;
      gameResultDto.is_done = false;
      gameResultDto.is_done = false;
      gameResultDto.time_start = new Date();
      try {
        const game_result_new = await this.gameResultService.create(
          gameResultDto,
        );
        // Get Data game
        switch (gameResultDto?.game_id) {
          case 1:
            // Candidate start play logicalQuestion
            const logical_question_render_next =
              await this.gameService.getLogicalQuestionRender([], []);
            // create logical_game_result
            const logical_game_result_new =
              await this.gameResultService.createLogicalGameResult({
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
                  game_result: this.gameResultPlaying,
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
          case 2:
            // Candidate start play memoryGame
            try {
              const correct_answer = [
                ['left', 'right'][
                  Math.floor(Math.random() * ['left', 'right'].length)
                ],
              ];
              const memory_game_result_new =
                await this.gameResultService.createMemoryGameResult({
                  game_result_id: game_result_new.id,
                  memory_game_id: (
                    await this.gameService.getMemoryDataByLevel(1)
                  ).id,
                  correct_answer: JSON.stringify(correct_answer),
                  answer_play: null,
                  is_correct: null,
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
                      game_result_id: memory_game_result_final_by_game_result.game_result_id,
                      memory_game_result_id: memory_game_result_final_by_game_result.id,
                      memory_game_id: memory_game_result_final_by_game_result.memory_game_id,
                      level: memory_game_result_final_by_game_result.memory_game.level,
                      score: memory_game_result_final_by_game_result.memory_game.score,
                      time_limit: memory_game_result_final_by_game_result.memory_game.time_limit,
                      correct_answer: JSON.parse(
                        memory_game_result_final_by_game_result.correct_answer,
                      ),
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
            return this.errorsResponse(
              {
                message: 'You are not allowed to play this game.',
                data: {
                  game_result: this.gameResultPlaying,
                },
              },
              res,
            );
        }
      } catch (e) {
        console.log('Error start play game_result: ' + e.message);
      }
    }
  }

  @Post('playing-memory')
  @UseGuards(JwtAuthGuard)
  async playingMemoryGame(
    @Body()
    memoryGameResultDto: {
      answer_play: string;
      is_correct: boolean;
    },
    @Res() res: Response,
  ) {
    // validate check started game
    if (!this.timeStart) {
      return this.errorsResponse(
        {
          message: 'You need to start game!',
        },
        res,
      );
    } else {
      let message_res = '';
      // validate check play_time end time_limit's level
      const play_time_item = Date.now() - this.timeNextMemoryItem;
      if (play_time_item > this.memoryDataRenderCurrent.time_limit) {
        this.gameResultPlaying.is_done = true;
        await this.gameResultService.updateIsDoneGameResult(
          this.gameResultPlaying.id,
        );
        return this.successResponse(
          {
            message: `Time play level ${this.memoryDataRenderCurrent['level']} expired. End game.`,
            data: {
              game_result: this.gameResultPlaying,
              memory_data_history:
                await this.gameResultService.get_memory_game_result_by_game_result_id(
                  this.gameResultPlaying.id,
                ),
            },
          },
          res,
        );
      }
      try {
        // Check answer_play is true or false?
        if (
          arraysEqualWithoutLength(
            memoryGameResultDto.answer_play,
            this.memoryDataRenderCurrent.correct_answer,
          ) === true
        ) {
          message_res = 'Your answer is true.';
          memoryGameResultDto.is_correct = true;
          this.gameResultPlaying.is_done = false;
          if (!this.gameResultPlaying?.play_score) {
            this.gameResultPlaying.play_score =
              this.memoryDataRenderCurrent['score'];
          } else {
            this.gameResultPlaying.play_score +=
              this.memoryDataRenderCurrent['score'];
          }
          this.gameResultPlaying.is_done = false;
        } else {
          message_res = 'Your answer is false. End game';
          memoryGameResultDto.is_correct = false;
          this.gameResultPlaying.is_done = true;
        }
        // End check done
        // updateGameResult
        await this.gameResultService.updateGameResultPlayTimeAndScore({
          id: this.gameResultPlaying.id,
          play_time: Date.now() - this.timeStart,
          play_score: this.gameResultPlaying.play_score,
        });
        // createMemoryGameResult
        await this.gameResultService.createMemoryGameResult({
          game_result_id: this.gameResultPlaying.id,
          memory_game_id: this.memoryDataRenderCurrent.id,
          correct_answer: JSON.stringify(
            this.memoryDataRenderCurrent.correct_answer,
          ),
          answer_play: JSON.stringify(memoryGameResultDto.answer_play),
          is_correct: memoryGameResultDto.is_correct,
        });
        // Return if player answer true/false?
        if (!!memoryGameResultDto.is_correct) {
          this.timeNextMemoryItem = Date.now();
          // new memoryDataRenderCurrent: next level
          const correct_answer = [];
          for (let i = 1; i <= this.memoryDataRenderCurrent.level + 1; i++) {
            correct_answer.push(
              ['left', 'right'][
                Math.floor(Math.random() * ['left', 'right'].length)
              ],
            );
          }
          const memoryDataRender = await this.gameService.getMemoryDataByLevel(
            this.memoryDataRenderCurrent.level + 1,
          );
          this.memoryDataRenderCurrent = {
            id: memoryDataRender.id,
            level: memoryDataRender.level,
            score: memoryDataRender.score,
            time_limit: memoryDataRender.time_limit,
            correct_answer: correct_answer,
          };
          // END: new memoryDataRenderCurrent: next level.
          return this.successResponse(
            {
              message: message_res,
              data: {
                game_result: this.gameResultPlaying,
                correct_answer: JSON.stringify(
                  this.memoryDataRenderCurrent.correct_answer,
                ),
                memory_data_next: this.memoryDataRenderCurrent,
              },
            },
            res,
          );
        } else {
          return this.errorsResponse(
            {
              message: message_res,
              data: {
                game_result: this.gameResultPlaying,
                memory_data_history:
                  await this.gameResultService.get_memory_game_result_by_game_result_id(
                    this.gameResultPlaying.id,
                  ),
              },
            },
            res,
          );
        }
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  @Put('end')
  async endPlayGame(
    @Body()
    gameResultDto: {
      id: number;
      candidate_id: number;
      assessment_id: number;
      game_id: number;
      play_time: number;
      play_score: number;
      is_done: true;
    },
    @Res() res: Response,
  ) {
    try {
      await this.gameResultService.updateIsDoneGameResult(gameResultDto.id);
      // const dataNew = gameResultDto;
      return res.status(HttpStatus.OK).json({
        message: 'End play game success',
      });
    } catch (e) {
      console.log(e.message);
    }
  }
}
