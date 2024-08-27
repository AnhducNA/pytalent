import { Body, Controller, Param, Patch, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { LogicalGameResultService } from '../logicalGameResult.service';

@Controller('api/game-result-playing-logical')
export class GameResultPlayingLogicalController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly logicalAnswerService: LogicalGameResultService,
  ) {
    super();
  }

  @Patch('logical-game-answer/:logicalAnswerId')
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
