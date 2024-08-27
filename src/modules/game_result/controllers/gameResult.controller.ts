import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { AuthGuard } from '@guards/auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { LogicalGameResultService } from '../logicalGameResult.service';

@Controller('api/game-result')
export class GameResultController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly logicalGameResultService: LogicalGameResultService,
  ) {
    super();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/by-candidate')
  async getGameResultByCandidateId(@Req() req: any, @Res() res: any) {
    const userLogin = req['userLogin'];
    const gameResultList =
      await this.gameResultService.getGameResultByCandidateId(userLogin.id);
    for (const game_result of gameResultList) {
      game_result.play_score =
        await this.gameResultService.get_total_play_score_by_game_result(
          game_result.id,
          game_result.game_id,
        );
    }
    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        user_login: userLogin,
        game_result_list: gameResultList,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('/game-result-detail/candidate')
  async getGameResultDetailByGameResultIdAndCandidateId(
    @Req() req: any,
    @Body()
    gameResultDetailDto: {
      game_result_id: number;
    },
    @Res() res: any,
  ) {
    const userLogin = req['userLogin'];
    const game_result = await this.gameResultService.findOne(
      gameResultDetailDto.game_result_id,
    );
    // validate check game_result?.candidate_id
    if (!game_result || game_result.candidate_id !== userLogin.id) {
      return this.errorsResponse(
        {
          message: `You cannot view the game_result.`,
        },
        res,
      );
    }
    switch (game_result.game_id) {
      case 1:
        const logicalGameResultList =
          await this.gameResultService.getLogicalGameResultByGameResultIdAndCandidateId(
            gameResultDetailDto.game_result_id,
            userLogin.id,
          );
        return res.status(HttpStatus.OK).json({
          success: true,
          data: {
            game_result: game_result,
            logical_game_result_history: logicalGameResultList,
          },
        });
      case 2:
        const memoryGameResultList =
          await this.gameResultService.getMemoryGameResultByGameResultIdAndCandidateId(
            gameResultDetailDto.game_result_id,
            userLogin.id,
          );
        return res.status(HttpStatus.OK).json({
          success: true,
          data: {
            game_result: game_result,
            memory_game_result_history: memoryGameResultList,
          },
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

  @Get('logical-game-result-item/:logicalGameResultId')
  async findLogicalGameResult(
    @Param() params: { logicalGameResultId: number },
    @Res() res: any,
  ) {
    const result = await this.logicalGameResultService.findLogicalGameResult(
      params.logicalGameResultId,
    );
    return this.successResponse(
      {
        data: result,
      },
      res,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Req() req: any, @Res() res: any) {
    const result = await this.gameResultService.delete_game_result_by_id(
      req.params.id,
    );
    return this.successResponse(
      {
        message: 'success',
        data: result,
      },
      res,
    );
  }
}
