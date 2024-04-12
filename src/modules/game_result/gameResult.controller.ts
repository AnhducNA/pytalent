import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { AuthGuard } from '@guards/auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { Response } from 'express';
import { GameService } from '@modules/game/game.service';
import { arraysEqual } from '@helper/function';

@Controller('api/game-result')
export class GameResultController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  private timeStart: any;

  //  Start playing game
  @Post('start')
  @UseGuards(AuthGuard)
  async startPlayGame(
    @Req() req,
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
    const userLogin = req['userLogin'];
    gameResultDto.candidate_id = userLogin.id;
    try {
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
      // const dataNew = await this.gameResultService.create(gameResultDto);
      const dataNew = gameResultDto;
      // Get Data Question
      switch (gameResultDto?.game_id) {
        case 1:
          const logicalGameRender = await this.gameService.getLogicalGameRender(
            25,
          );
          return res.status(HttpStatus.OK).json({
            message: 'Start play game logical success',
            data: dataNew,
            data_logical_game: logicalGameRender,
          });
        case 2:
          return res.status(HttpStatus.OK).json({
            message: 'Start play game memory success',
            data: dataNew,
          });
        default:
          break;
      }
    } catch (e) {
      console.log(e.message);
    }
  }

  @Post('playing-logical')
  async playingLogicalGame(
    @Body()
    logicalGameResultDto: {
      game_result_id: number;
      logical_game_id: number;
      answer_play: string;
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
        } else {
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
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'You need to start game!',
      });
    } else {
      let message_res = '';
      const play_time = Date.now() - this.timeStart;
      try {
        const gameResultData = await this.gameResultService.findOne(
          memoryGameResultDto.game_result_id,
        );
        const memoryGameData = await this.gameService.findMemoryGameById(
          memoryGameResultDto.memory_game_id,
        );
        // parser JSON for correct_answer of memoryGame
        memoryGameData.correct_answer = memoryGameData
          ? JSON.parse(memoryGameData.correct_answer)
          : '';
        // Check answer_play is true
        if (
          arraysEqual(
            memoryGameResultDto.answer_play,
            memoryGameData.correct_answer,
          ) === true
        ) {
          message_res = 'Your answer is true.';
          memoryGameResultDto.is_correct = true;
          gameResultData.play_score += memoryGameData.score;
        } else {
          message_res = 'Your answer is false. End game';
          memoryGameResultDto.is_correct = false;
          gameResultData.is_done = true;
        }
        // updateGameResult
        await this.gameResultService.updateGameResult({
          id: memoryGameResultDto.game_result_id,
          candidate_id: gameResultData.candidate_id,
          assessment_id: gameResultData.assessment_id,
          game_id: gameResultData.game_id,
          play_time: play_time,
          play_score: gameResultData.play_score,
          is_done: gameResultData.is_done,
        });
        // createMemoryGameResult
        await this.gameResultService.createMemoryGameResult({
          game_result_id: memoryGameResultDto.game_result_id,
          memory_game_id: memoryGameResultDto.memory_game_id,
          answer_play: JSON.stringify(memoryGameResultDto.answer_play),
          is_correct: memoryGameResultDto.is_correct,
        });
        return res.status(HttpStatus.OK).json({
          message: message_res,
          data: memoryGameResultDto,
        });
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

  @UseGuards(AuthGuard)
  @Get('/by-candidate')
  async getGameResultByCandidateId(
    @Req() req: any,
    @Body() logicalGameResultDto: any,
    @Res() res: any,
  ) {
    const userLogin = req['userLogin'];
    const gameResultList =
      await this.gameResultService.getGameResultByCandidateId(userLogin.id);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: gameResultList,
    });
  }
  @UseGuards(AuthGuard)
  @Post('/game-result-detail/candidate')
  async getGameResultDetailByGameResultIdAndCandidateId(
    @Req() req: any,
    @Body()
    gameResultDetailDto: {
      game_result_id: number;
      game_id: number;
    },
    @Res() res: any,
  ) {
    const userLogin = req['userLogin'];
    switch (gameResultDetailDto.game_id) {
      case 1:
        const logicalGameResultList =
          await this.gameResultService.getLogicalGameResultByGameResultIdAndCandidateId(
            gameResultDetailDto.game_result_id,
            userLogin.id,
          );
        return res.status(HttpStatus.OK).json({
          success: true,
          data: logicalGameResultList,
        });
      case 2:
        const memoryGameResultList =
          await this.gameResultService.getMemoryGameResultByGameResultIdAndCandidateId(
            gameResultDetailDto.game_result_id,
            userLogin.id,
          );
        return res.status(HttpStatus.OK).json({
          success: true,
          data: memoryGameResultList,
        });
      default:
        break;
    }
  }

  //get all game_result
  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.gameResultService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  findOne(@Param() params) {
    return this.gameResultService.findOne(params.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Request() req,
    @Body() gameResultDto: object,
    @Res() res: Response,
  ) {
    const result = await this.gameResultService.create(gameResultDto);
    if (!result) {
      return this.errorsResponse(
        {
          message: 'error',
        },
        res,
      );
    } else {
      return this.successResponse(
        {
          message: 'success',
        },
        res,
      );
    }
  }
}
