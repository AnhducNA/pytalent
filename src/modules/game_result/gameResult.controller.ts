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
import { GameResultService } from '@modules/game_result/gameResult.service';
import { AuthGuard } from '@guards/auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { Response } from 'express';

@Controller('api/game-result')
export class GameResultController extends BaseController {
  constructor(private readonly gameResultService: GameResultService) {
    super();
  }

  //get all game_result
  @Get()
  @UseGuards(AuthGuard)
  @Get()
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
