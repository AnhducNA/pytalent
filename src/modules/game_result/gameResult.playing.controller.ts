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
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  private timeStart: any;
  private memoryDataRenderNext: object = {
    level: 0,
    time_limit: 0,
    score: 0,
    correct_answer: [],
  };

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
    const assessmentCheck = await this.gameResultService.findOneAssessment(
      gameResultDto.assessment_id,
    );
    if (!assessmentCheck) {
      return this.errorsResponse(
        {
          message: 'Assessment does not exit.',
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
        // const dataNew = await this.gameResultService.create(gameResultDto);
        const gameResultNew = gameResultDto;
        // Get Data game
        switch (gameResultDto?.game_id) {
          case 1:
            // Candidate play logicalQuestion
            const logicalQuestionRender =
              await this.gameService.getLogicalQuestionRender(20);
            return this.successResponse(
              {
                message: 'Start play game logical success',
                data: {
                  game_result: gameResultNew,
                  data_logical_question: logicalQuestionRender,
                },
              },
              res,
            );
          case 2:
            // Candidate play memoryGame
            const memoryDataRender: object =
              await this.gameService.getMemoryDataByLevel(1);
            const data_type = ['left', 'right'];
            memoryDataRender['correct_answer'] = [
              data_type[Math.floor(Math.random() * data_type.length)],
            ];
            this.memoryDataRenderNext = memoryDataRender;
            return this.successResponse(
              {
                message: 'Start play game memory success',
                data: {
                  game_result: gameResultNew,
                  memory_data: memoryDataRender,
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
      game_result_id: number;
      memory_game_id: number;
      answer_play: string;
      is_correct: boolean;
    },
    @Res() res: Response,
  ) {
    if (!this.timeStart) {
      return this.errorsResponse(
        {
          message: 'You need to start game!',
        },
        res,
      );
    } else {
      let message_res = '';
      const play_time = Date.now() - this.timeStart;
      if (play_time > this.memoryDataRenderNext['time_limit']) {
        return this.successResponse(
          {
            message: `Time play level ${this.memoryDataRenderNext['level']} expired.`,
          },
          res,
        );
      } else {
        try {
          const gameResultData = await this.gameResultService.findOne(
            memoryGameResultDto.game_result_id,
          );
          console.log(
            memoryGameResultDto.answer_play,
            this.memoryDataRenderNext['correct_answer'],
            arraysEqualWithoutLength(
              memoryGameResultDto.answer_play,
              this.memoryDataRenderNext['correct_answer'],
            ),
            31254,
          );

          // Check answer_play is true
          // if (
          //   arraysEqualWithoutLength(
          //     memoryGameResultDto.answer_play,
          //     this.memoryDataRenderNext['correct_answer'],
          //   ) === true
          // ) {
          //   message_res = 'Your answer is true.';
          //   memoryGameResultDto.is_correct = true;
          //   gameResultData.play_score += this.memoryDataRenderNext['score'];
          // } else {
          //   message_res = 'Your answer is false. End game';
          //   memoryGameResultDto.is_correct = false;
          //   gameResultData.is_done = true;
          // }
          // updateGameResult
          // await this.gameResultService.updateGameResult({
          //   id: memoryGameResultDto.game_result_id,
          //   candidate_id: gameResultData.candidate_id,
          //   assessment_id: gameResultData.assessment_id,
          //   game_id: gameResultData.game_id,
          //   play_time: play_time,
          //   play_score: gameResultData.play_score,
          //   is_done: gameResultData.is_done,
          // });
          // createMemoryGameResult
          // await this.gameResultService.createMemoryGameResult({
          //   game_result_id: memoryGameResultDto.game_result_id,
          //   memory_game_id: memoryGameResultDto.memory_game_id,
          //   answer_play: JSON.stringify(memoryGameResultDto.answer_play),
          //   is_correct: memoryGameResultDto.is_correct,
          // });
          return res.status(HttpStatus.OK).json({
            message: message_res,
            data: memoryGameResultDto,
          });
        } catch (e) {
          console.log(e.message);
        }
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
