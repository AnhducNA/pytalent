import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';

@Controller('api/memory-game')
export class GameMemoryController extends BaseController {
  constructor(private readonly gameService: GameService) {
    super();
  }

  @Get('/list')
  @UseGuards(JwtAuthGuard)
  async findAll(@Res() res: Response) {
    const dataList = await this.gameService.getMemoryGame();
    return this.successResponse(
      {
        data: dataList,
        message: 'success',
      },
      res,
    );
  }

  @Post('new')
  @UseGuards(JwtAuthGuard)
  async createMemoryLogicalGame(
    @Body()
    memoryGameDto: {
      level: number;
      correct_answer: any;
      score: number;
    },
    @Res() res: Response,
  ) {
    const validateResult = await this.gameService.validateMemoryGame(
      memoryGameDto,
    );
    if (validateResult.status === false) {
      return this.errorsResponse(
        {
          message: validateResult.message,
        },
        res,
      );
    }
    if (validateResult.status === true) {
      // convert object to JSON
      memoryGameDto.correct_answer = JSON.stringify(
        memoryGameDto.correct_answer,
      );
      const result = await this.gameService.createMemoryGame(memoryGameDto);
      return this.successResponse(
        {
          data: result,
          message: 'success',
        },
        res,
      );
    }
  }
}
