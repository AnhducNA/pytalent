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
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { AssessmentService } from '@modules/assessment/assessment.service';
import { LogicalGameResultService } from '../logicalGameResult.service';
import { MemoryGameResultService } from '../memoryGameResult.service';

@Controller('api/game-result-playing')
export class GameResultPlayingController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
    private readonly assessmentService: AssessmentService,
    private readonly logicalGameResultService: LogicalGameResultService,
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
    const response = await this.gameResultService.startPlayGame(
      userLogin.id,
      gameResultDto,
    );

    return this.successResponse(response, res);
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
