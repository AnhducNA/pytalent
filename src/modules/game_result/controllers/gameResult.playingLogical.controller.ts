import { Body, Controller, Param, Patch, Res, UseGuards } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { Response } from 'express';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameService } from '@modules/game/game.service';
import { LogicalGameResultService } from '../logicalGameResult.service';

@Controller('api/game-result-playing-logical')
export class GameResultPlayingLogicalController extends BaseController {
  constructor(
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
    private readonly logicalGameResultService: LogicalGameResultService,
  ) {
    super();
  }

  @Patch('logical-game-answer/:logicalGameResultId')
  @UseGuards(JwtAuthGuard)
  async playingLogicalGame(
    @Param() params: { logicalGameResultId: number },
    @Body()
    logicalGameAnswerDto: {
      answerPlay: boolean;
    },
    @Res() res: Response,
  ) {
    // get logical_game_result place hold
    const resLogicalResultPlaceHold =
      await this.logicalGameResultService.findLogicalGameResultPlaceHold(
        params.logicalGameResultId,
      );

    if (resLogicalResultPlaceHold.status === false) {
      return this.errorsResponse(resLogicalResultPlaceHold, res);
    }
    const logicalAnswerPlaceHold = resLogicalResultPlaceHold.data;

    const gameResultUpdate = await this.gameResultService.findOne(
      logicalAnswerPlaceHold.game_result_id,
    );

    const validateGameResult =
      await this.logicalGameResultService.validateGameResult(
        gameResultUpdate,
        logicalAnswerPlaceHold,
      );

    // have validate => end game
    if (validateGameResult.status === false) {
      await this.gameResultService.updateGameResultFinish(gameResultUpdate.id);
      return this.errorsResponse(validateGameResult, res);
    }

    // check logical answer is true or false
    const checkCorrectAnswer =
      await this.logicalGameResultService.checkCorrectAnswer(
        logicalGameAnswerDto.answerPlay,
        gameResultUpdate.play_score,
        logicalAnswerPlaceHold,
      );
    if (checkCorrectAnswer.isCorrect === true) {
      await this.gameResultService.updateGameResultWithPlayScore(
        gameResultUpdate.id,
        checkCorrectAnswer.data.newPlayScore,
      );
    }
    // update LogicalGameResult
    await this.gameResultService.updateAnsweredLogicalGameResult(
      logicalAnswerPlaceHold.id,
      logicalGameAnswerDto.answerPlay,
      checkCorrectAnswer.isCorrect,
    );

    // Check final logical game => compare index question with total question
    if (logicalAnswerPlaceHold.index >= 20) {
      await this.gameResultService.updateGameResultFinish(gameResultUpdate.id);
      return this.successResponse(
        {
          message: `You answered all question. Game over.`,
        },
        res,
      );
    }

    const logicalQuestionNext =
      await this.logicalGameResultService.getNextLogicalQuestion(
        logicalAnswerPlaceHold,
        gameResultUpdate.id,
      );
    return this.successResponse(
      {
        message: checkCorrectAnswer.message,
        data: logicalQuestionNext,
      },
      res,
    );
  }
}
