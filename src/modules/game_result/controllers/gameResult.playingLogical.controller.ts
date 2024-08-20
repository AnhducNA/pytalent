import { Body, Controller, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { LogicalGameResultService } from '../logicalGameResult.service';

@Controller('api/game-result-playing-logical')
export class GameResultPlayingLogicalController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
    private readonly logicalGameResultService: LogicalGameResultService,
  ) {
    super();
  }

  @Patch('logical-game-answer/:logicalGameResultId')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Req() req: any,
    @Body()
    logicalGameAnswerDto: {
      answerPlay: boolean;
    },
    @Res() res: Response,
  ) {
    const result = await this.logicalGameResultService.handlePlayingLogical(
      req.params.logicalGameResultId,
      logicalGameAnswerDto.answerPlay,
    );
    return this.successResponse(
      {
        data: result,
      },
      res,
    );
  }
}
