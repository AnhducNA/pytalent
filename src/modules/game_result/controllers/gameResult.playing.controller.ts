import {
  Body,
  Controller,
  Get,
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
  private _logical_except_and_check_identical_answer: {
    id_logical_list_except: any[];
    check_identical_answer: any[];
  };
  private _logicalQuestionRenderCurrent: {
    id: number;
    number: number;
    statement1: string;
    statement2: string;
    conclusion: string;
    score: number;
    correct_answer: boolean;
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

  get logical_except_and_check_identical_answer(): {
    id_logical_list_except: any[];
    check_identical_answer: any[];
  } {
    return this._logical_except_and_check_identical_answer;
  }

  set logical_except_and_check_identical_answer(value: {
    id_logical_list_except: any[];
    check_identical_answer: any[];
  }) {
    this._logical_except_and_check_identical_answer = value;
  }

  get logicalQuestionRenderCurrent(): {
    id: number;
    number: number;
    statement1: string;
    statement2: string;
    conclusion: string;
    score: number;
    correct_answer: boolean;
  } {
    return this._logicalQuestionRenderCurrent;
  }

  set logicalQuestionRenderCurrent(value: {
    id: number;
    number: number;
    statement1: string;
    statement2: string;
    conclusion: string;
    score: number;
    correct_answer: boolean;
  }) {
    this._logicalQuestionRenderCurrent = value;
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
          message: `Assessment has expired: ${userLogin.email}.`,
        },
        res,
      );
    }
    // validate check assessment exit Candidate?
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

      return this.successResponse(
        {
          message: 'Continue.',
        },
        res,
      );
    } else {
      //   Start play game: create new game_result
      // Default value game_result before add new
      gameResultDto.play_time = 0;
      gameResultDto.play_score = 0;
      gameResultDto.is_done = false;
      gameResultDto.is_done = false;
      gameResultDto.time_start = new Date();
      try {
        const gameResultPlaying = await this.gameResultService.create(
          gameResultDto,
        );
        // Get Data game
        switch (gameResultDto?.game_id) {
          case 1:
            // Candidate play logicalQuestion
            const logical_question_render_next =
              await this.gameService.getLogicalQuestionRender([], []);
            // create logical_game_result
            const logical_game_result_new =
              await this.gameResultService.createLogicalGameResult({
                index: 1,
                game_result_id: gameResultPlaying.id,
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
            // Candidate play memoryGame
            this.timeNextMemoryItem = Date.now();
            const memoryDataRender =
              await this.gameService.getMemoryDataByLevel(1);
            const correct_answer = [
              ['left', 'right'][
                Math.floor(Math.random() * ['left', 'right'].length)
              ],
            ];
            this.memoryDataRenderCurrent = {
              id: memoryDataRender.id,
              level: memoryDataRender.level,
              score: memoryDataRender.score,
              time_limit: memoryDataRender.time_limit,
              correct_answer: correct_answer,
            };
            return this.successResponse(
              {
                message: 'Start play game memory success.',
                data: {
                  game_result: this.gameResultPlaying,
                  memory_data_next: this.memoryDataRenderCurrent,
                },
              },
              res,
            );
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

      return this.successResponse(
        {
          message: 'Start.',
        },
        res,
      );
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

  //  Continue playing game
  @Get('continue_playing_game_result/:game_result_id')
  @UseGuards(JwtAuthGuard)
  async continuePlayingGameResult(@Req() req: any, @Res() res: Response) {
    // set candidate_id for gameResultDto
    const userLogin = req['userLogin'];
    this.gameResultPlaying = await this.gameResultService.findOne(
      req.params.game_result_id,
    );
    if (!this.gameResultPlaying) {
      return this.errorsResponse(
        {
          message: `Game_result, id = ${req.params.game_result_id} does not exit.`,
        },
        res,
      );
    }
    // validate check game_result is done
    if (this.gameResultPlaying.is_done === true) {
      return this.successResponse(
        {
          data: this.gameResultPlaying,
          message: `Game over. Can't continue.`,
        },
        res,
      );
    }
    // validate check assessment time_end
    const assessment_time_end = (
      await this.gameResultService.get_assessment_by_id(
        this.gameResultPlaying.assessment_id,
      )
    ).time_end;
    if (Date.now() - assessment_time_end.getTime() > 0) {
      return this.errorsResponse(
        {
          message: `Assessment has expired: ${userLogin.email}.`,
        },
        res,
      );
    }
    // validate check assessment exit?
    const assessmentCheckCandidate =
      await this.gameResultService.findOneAssessmentCandidate(
        this.gameResultPlaying.assessment_id,
        userLogin.id,
      );
    if (!assessmentCheckCandidate) {
      return this.errorsResponse(
        {
          message: `Assessment does not have candidate: ${userLogin.email}.`,
        },
        res,
      );
    } else {
      // Default value before continue
      this.timeStart = Date.now() - this.gameResultPlaying.play_time;
      try {
        this.gameResultPlaying = this.gameResultPlaying;
        // Get Data game
        switch (this.gameResultPlaying?.game_id) {
          case 1:
            // Candidate play logicalQuestion
            const logical_game_result_list =
              await this.gameResultService.get_logical_game_result_by_game_result(
                this.gameResultPlaying.id,
              );
            this.logical_except_and_check_identical_answer = {
              id_logical_list_except: Object.values(
                logical_game_result_list,
              ).map((obj) => obj.logical_question_id),
              check_identical_answer: Object.values(
                logical_game_result_list,
              ).map((obj) => obj.logical_question.correct_answer),
            };
            this.logicalQuestionRenderCurrent = {
              ...{ number: logical_game_result_list.length + 1 },
              ...(await this.gameService.getLogicalQuestionRender(
                this.logical_except_and_check_identical_answer
                  .id_logical_list_except,
                this.logical_except_and_check_identical_answer
                  .check_identical_answer,
              )),
            };
            return this.successResponse(
              {
                message: 'Continue play game logical success',
                data: {
                  game_result: this.gameResultPlaying,
                  logical_question_render_next: {
                    id: this.logicalQuestionRenderCurrent.id,
                    number: this.logicalQuestionRenderCurrent.number,
                    statement1: this.logicalQuestionRenderCurrent.statement1,
                    statement2: this.logicalQuestionRenderCurrent.statement2,
                    conclusion: this.logicalQuestionRenderCurrent.conclusion,
                    score: this.logicalQuestionRenderCurrent.score,
                  },
                },
              },
              res,
            );
          case 2:
            // Candidate play memoryGame
            const count_memory_game_result_list =
              await this.gameResultService.get_count_memory_game_result_by_game_result(
                this.gameResultPlaying.id,
              );
            this.timeNextMemoryItem = Date.now();
            const memoryDataRender =
              await this.gameService.getMemoryDataByLevel(
                count_memory_game_result_list + 1,
              );
            let correct_answer = [];
            for (let i = 1; i <= count_memory_game_result_list + 1; i++) {
              correct_answer = [
                ...correct_answer,
                ['left', 'right'][
                  Math.floor(Math.random() * ['left', 'right'].length)
                ],
              ];
            }
            this.memoryDataRenderCurrent = {
              id: memoryDataRender.id,
              level: memoryDataRender.level,
              score: memoryDataRender.score,
              time_limit: memoryDataRender.time_limit,
              correct_answer: correct_answer,
            };
            return this.successResponse(
              {
                message: 'Start play game memory success.',
                data: {
                  game_result: this.gameResultPlaying,
                  memory_data_next: this.memoryDataRenderCurrent,
                },
              },
              res,
            );
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
        console.log(e.message);
      }
    }
  }
}
