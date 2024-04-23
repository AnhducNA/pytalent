import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RoleEnum } from '@enum/role.enum';
import { AuthorizationGuard } from '@guards/authorization.guard';

@Controller('api/logical-question')
export class GameLogicalController extends BaseController {
  constructor(private readonly gameService: GameService) {
    super();
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async findAll(@Res() res: Response) {
    const dataList = await this.gameService.getLogicalQuestion();
    return this.successResponse(
      {
        data: dataList,
        message: 'success',
      },
      res,
    );
  }

  @Post('new')
  async createLogicalGame(
    @Body()
    logicalGameDto: {
      statement1: string;
      statement2: string;
      conclusion: string;
      correct_answer: boolean;
      score: number;
    },
    @Res() res: Response,
  ) {
    const result = await this.gameService.createLogicalGame(logicalGameDto);
    return this.successResponse(
      {
        message: 'success',
        data: result,
      },
      res,
    );
  }
}
