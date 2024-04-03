import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { GamePlayingService } from '@modules/game_playing/gamePlaying.service';
import { BaseController } from '@modules/app/base.controller';

@Controller('api/game-playing')
export class GamePlayingController extends BaseController {
  constructor(private readonly gamePlayingService: GamePlayingService) {
    super();
  }

  @Post('/logical')
  async LogicalPlaying(@Res() res: Response, @Body() logicalGameListDto: any) {
    const newLogicalGameListResult = [];
    let score_result_total = 0;
    let correct_answer_result_total = 0;
    // newLogicalGameListResult
    for (const logicalGameDto of logicalGameListDto) {
      const logicalGameResult =
        await this.gamePlayingService.findLogicalGameById(logicalGameDto.id);
      logicalGameDto.correct_answer = logicalGameResult.correct_answer;
      if (logicalGameResult.correct_answer === logicalGameDto.answer) {
        // answer is true
        logicalGameDto.score_result = logicalGameResult.score;
        score_result_total += logicalGameResult.score;
        correct_answer_result_total++;
      } else {
        logicalGameDto.score_result = 0;
      }
      newLogicalGameListResult.push(logicalGameDto);
    }
    return res.status(HttpStatus.OK).json({
      message: 'success',
      data: newLogicalGameListResult,
      score_result_total: score_result_total,
      correct_answer_result_total: correct_answer_result_total,
    });
  }
}
