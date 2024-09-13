import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/services/gameResult.service';
import { AuthGuard } from '@guards/auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { LogicalGameResultService } from '../services/logicalAnswer.service';
import { IUserLogin } from '@shared/interfaces/user.interface';
import { MemoryGameResultService } from '../services/memoryGameResult.service';

@Controller('api/game-result')
export class GameResultController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly logicalGameResultService: LogicalGameResultService,
    private readonly memoryAnswerService: MemoryGameResultService,
  ) {
    super();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/by-candidate')
  async getGameResultByCandidate(@Req() req: any, @Res() res: any) {
    const userLogin: IUserLogin = req['userLogin'];
    const data = await this.gameResultService.getListGameResultOfCandidate(
      userLogin.id,
    );
    return res.status(HttpStatus.OK).json({
      status: true,
      data: {
        gameResultList: data,
      },
    });
  }

  // detail history play game
  @UseGuards(JwtAuthGuard)
  @Get('/:gameResultId/history-detail-play')
  async getGameResultDetailByGameResultIdAndCandidateId(
    @Req() req: any,
    @Param() params: { gameResultId: number },
    @Res() res: any,
  ) {
    const data = await this.gameResultService.getGameResultDetailOfCandidate(
      req['userLogin'].id,
      params.gameResultId,
    );
    return this.successResponse({ data }, res);
  }

  //get all game_result
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(@Res() res: Response) {
    const data = await this.gameResultService.getAll();
    return this.successResponse({ data }, res);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  async getOne(@Param() params: { id: number }, @Res() res: Response) {
    const data = await this.gameResultService.getOne(params.id);
    return this.successResponse({ data }, res);
  }

  @Get('logical-game-result-item/:logicalGameResultId')
  async findLogicalGameResult(
    @Param() params: { logicalGameResultId: number },
    @Res() res: any,
  ) {
    const data = await this.logicalGameResultService.findLogicalGameResult(
      params.logicalGameResultId,
    );
    return this.successResponse({ data }, res);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Req() req: any, @Res() res: any) {
    const result = await this.gameResultService.delete(req.params.id);
    return this.successResponse(
      {
        message: 'success',
        data: result,
      },
      res,
    );
  }
}
