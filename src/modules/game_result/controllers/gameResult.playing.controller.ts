import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/services/gameResult.service';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { CreateGameResultDto } from '@modules/game_result/createGameResult.dto';
import { LogicalGameResultService } from '../services/logicalGameResult.service';
import { MemoryGameResultService } from '../services/memoryGameResult.service';
import { GameResultPlayingService } from '../services/gameResult.playing.service';

@Controller('api/game-result-playing')
export class GameResultPlayingController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameResultPlayingService: GameResultPlayingService,
    private readonly logicalAnswerService: LogicalGameResultService,
    private readonly memoryAnswerService: MemoryGameResultService,
  ) {
    super();
  }

  //  Start playing game
  @Post('play')
  @UseGuards(JwtAuthGuard)
  async startPlayingGame(
    @Req() req: any,
    @Body() gameResultDto: CreateGameResultDto,
    @Res() res: Response,
  ) {
    const userLogin = req['userLogin'];
    // set candidate_id for gameResultDto
    gameResultDto.candidate_id = userLogin.id;
    const response = await this.gameResultPlayingService.startPlayGame(
      userLogin.id,
      gameResultDto,
    );

    return this.successResponse(response, res);
  }

  @Get('pause/:gameResultId')
  async exitPlayGame(@Req() req: any, @Res() res: Response) {
    const gameResultId = req.params.gameResultId;
    await this.gameResultPlayingService.pauseOrExitPlayGame(gameResultId);
    return this.successResponse(
      {
        message: 'Pause game success.',
      },
      res,
    );
  }

  @Get('end/:gameResultId')
  async endPlayGame(@Req() req: any, @Res() res: Response) {
    try {
      const gameResultId = req.params.gameResultId;
      await this.gameResultPlayingService.endPlayGame(gameResultId);
      return this.successResponse({ message: 'End game success.' }, res);
    } catch (e) {
      console.log(e.message);
    }
  }

  @Patch('logical-answer/:logicalAnswerId')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Param() params: { logicalAnswerId: number },
    @Body()
    logicalGameAnswerDto: {
      answerPlay: boolean;
    },
    @Res() res: Response,
  ) {
    const resData = await this.logicalAnswerService.caculatePlayingLogical(
      params.logicalAnswerId,
      logicalGameAnswerDto.answerPlay,
    );
    return this.successResponse(resData, res);
  }
}
