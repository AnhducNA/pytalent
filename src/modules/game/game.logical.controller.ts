import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';

@Controller('api/logical-game')
export class GameLogicalController extends BaseController {
  constructor(private readonly gameService: GameService) {
    super();
  }

  @Get('/list')
  async findAll(@Res() res: Response) {
    const dataList = await this.gameService.getLogicalGame();
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
    console.log(result);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }
}
