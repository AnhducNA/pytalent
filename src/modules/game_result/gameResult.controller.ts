import {
  Body,
  Controller,
  Get, HttpStatus,
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

  private timeStart: any;

  @Post('start')
  async startPlayGame(
    @Body() gameResultDto: {
      candidate_id: number, assessment_id: number, game_id: number,
      play_time: 0, play_score: 0, is_done: false
    },
    @Res() res: Response,
  ) {
    try {
      this.timeStart = Date.now();
      // await this.gameResultService.create(gameResultDto);
      return res.status(HttpStatus.OK).json({
        message: 'Add data success',
      });
    } catch (e) {
      console.log(e.message);
    }
  }

  @Post('playing-logical')
  async playingLogicalGame(@Body() logicalResultDto: object, @Res() res: Response) {
    if (!this.timeStart) {
      return res.status(HttpStatus.OK).json({
        success: false,
        message: 'You need to start game!',
      });
    } else {
      const time_play = Date.now() - this.timeStart;
      console.log(time_play);
      try {
        // await this.gameResultService.create(gameResultDto);
        // console.log(logicalResultDto);
        return res.status(HttpStatus.OK).json({
          message: 'Add data success',
        });
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  //get all game_result
  @Get()
  @UseGuards(AuthGuard)
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
