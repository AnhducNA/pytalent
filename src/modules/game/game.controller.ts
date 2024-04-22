import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameService } from '@modules/game/game.service';
import { Response } from 'express';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RoleEnum } from '@enum/role.enum';
import { AuthorizationGuard } from '@guards/authorization.guard';

@Controller('api/games')
export class GameController extends BaseController {
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

  @Get(':id')
  async findOne(@Param() params, @Res() res) {
    const dataResult = await this.gameService.findOne(params.id);
    if (!dataResult) {
      return this.errorsResponse(
        {
          message: `Don't have data`,
        },
        res,
      );
    } else {
      return this.successResponse(
        {
          data: dataResult,
          message: 'success',
        },
        res,
      );
    }
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async create(@Request() req, @Body() game: object, @Res() res: Response) {
    const resultGame = await this.gameService.checkOrCreateGame(game);
    return this.successResponse(
      {
        message: 'success',
        data: resultGame,
      },
      res,
    );
  }
}
