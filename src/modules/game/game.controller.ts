import { Body, Controller, Get, Post, Request, Res } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';
import { Game } from '@entities/game.entity';

@Controller('api/games')
export class GameController extends BaseController{
  constructor(private readonly gameService: GameService) {
    super();
  }

  @Get()
  async findAll(@Res() res: Response) {
    const dataList = await this.gameService.findAll();
    return this.successResponse(
      {
        data: dataList,
        message: 'success',
      },
      res,
    );
  }

  @Post()
  async create(
    @Request() req,
    @Body() game: Game
  ){
    console.log(game);
  }
}
