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
  private _logicalQuestionRenderCurrent: {
    id: number;
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

  get logicalQuestionRenderCurrent(): {
    id: number;
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
  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startPlayGame(
    @Req() req: any,
    @Body()
    gameResultDto: {
      candidate_id: number;
      assessment_id: number;
      game_id: number;
      play_time: 0;
      play_score: 0;
      is_done: false;
    },
    @Res() res: Response,
  ) {
    // set candidate_id for gameResultDto
    const userLogin = req['userLogin'];
    gameResultDto.candidate_id = userLogin.id;
    // validate check assessment exit?
    const assessmentCheck =
      await this.gameResultService.findOneAssessmentCandidate(
        gameResultDto.assessment_id,
        userLogin.id,
      );
    if (!assessmentCheck) {
      return this.errorsResponse(
        {
          message: `Assessment does not have candidate: ${userLogin.email}.`,
        },
        res,
      );
    } else {
      // Default value before start
      this.timeStart = Date.now();
      gameResultDto.play_time = gameResultDto.play_time
        ? gameResultDto.play_time
        : 0;
      gameResultDto.play_score = gameResultDto.play_score
        ? gameResultDto.play_score
        : 0;
      gameResultDto.is_done = gameResultDto.is_done
        ? gameResultDto.is_done
        : false;
      try {
        // const gameResultNew = await this.gameResultService.create(
        //   gameResultDto,
        // );
        const gameResultNew = gameResultDto;
        const objectId = { id: 20 };
        this.gameResultPlaying = { ...objectId, ...gameResultNew };
        // this.gameResultPlaying = gameResultNew;
        // Get Data game
        switch (gameResultDto?.game_id) {
          case 1:
            // Candidate play logicalQuestion
            this.logicalQuestionRenderCurrent =
              await this.gameService.getLogicalQuestionRender([]);
            return this.successResponse(
              {
                message: 'Start play game logical success',
                data: {
                  game_result: this.gameResultPlaying,
                  logical_question_render_next: {
                    id: this.logicalQuestionRenderCurrent.id,
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
            break;
        }
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  @Post('playing-logical')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Body()
    logicalGameResultDto: {
      game_result_id: number;
      logical_game_id: number;
      answer_play: boolean;
      is_correct: boolean;
    },
    @Res() res: Response,
  ) {
    if (!this.timeStart) {
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'You need to start game!',
      });
    } else {
      const play_time = Date.now() - this.timeStart;
      let message_res = '';
      try {
        const gameResultData = await this.gameResultService.findOne(
          logicalGameResultDto.game_result_id,
        );
        // check answer of user to + score
        const logicalGameData = await this.gameService.findLogicalGameById(
          logicalGameResultDto.logical_game_id,
        );
        // Check answer_play is true
        if (
          logicalGameResultDto.answer_play === logicalGameData.correct_answer
        ) {
          message_res = 'Your answer is true.';
          logicalGameResultDto.is_correct = true;
          gameResultData.play_score += logicalGameData.score;
          console.log(gameResultData, 1245);
        } else {
          console.log(gameResultData, 1245);
          message_res = 'Your answer is false. End game';
          logicalGameResultDto.is_correct = false;
          gameResultData.is_done = true;
        }
        // updateGameResult
        await this.gameResultService.updateGameResult({
          id: logicalGameResultDto.game_result_id,
          candidate_id: gameResultData.candidate_id,
          assessment_id: gameResultData.assessment_id,
          game_id: gameResultData.game_id,
          play_time: play_time,
          play_score: gameResultData.play_score,
          is_done: gameResultData.is_done,
        });
        // createLogicalGameResult
        await this.gameResultService.createLogicalGameResult(
          logicalGameResultDto,
        );
        return res.status(HttpStatus.OK).json({
          message: message_res,
          data: logicalGameResultDto,
        });
      } catch (e) {
        console.log(e.message);
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
      if (!this.timeStart) {
        return res.status(HttpStatus.OK).json({
          success: false,
          message: 'You need to start game!',
        });
      } else {
        gameResultDto.play_time = Date.now() - this.timeStart;
      }
      gameResultDto.is_done = gameResultDto.is_done
        ? gameResultDto.is_done
        : true;
      const dataNew = await this.gameResultService.updateGameResult(
        gameResultDto,
      );
      // const dataNew = gameResultDto;
      return res.status(HttpStatus.OK).json({
        message: 'End play game success',
        data: dataNew,
      });
    } catch (e) {
      console.log(e.message);
    }
  }
}
