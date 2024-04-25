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
import { JwtAuthGuard } from '@guards/jwt-auth.guard';

@Controller('api/game-result')
export class GameResultController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {
    super();
  }

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
