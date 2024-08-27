import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameResultService } from './gameResult.service';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '../game/game.service';
import { Repository } from 'typeorm';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';

@Injectable()
export class LogicalGameResultService {
  constructor(
    @InjectRepository(LogicalGameResult)
    private readonly logicalGameResultRepository: Repository<LogicalGameResult>,
    private readonly gameResultService: GameResultService,
    private readonly gameService: GameService,
  ) {}

  async findLogicalGameResult(logicalGameResultId: number) {
    const data = await this.logicalGameResultRepository.findOne({
      where: { id: logicalGameResultId },
      relations: ['logical_question'],
    });
    return data;
  }

  async getHistoryAnswered(gameResultId: number) {
    return this.logicalGameResultRepository.find({
      relations: ['logical_question'],
      where: { game_result_id: gameResultId },
    });
  }

  async findLogicalGameResultPlaceHold(logicalGameResultId: number) {
    const logicalGameResult = await this.findLogicalGameResult(
      logicalGameResultId,
    );
    // validate check logical_game_result exit
    if (!logicalGameResult) {
      return {
        status: false,
        message: `logicalGameResult with id = ${logicalGameResultId} does not exist.`,
      };
    }
    return {
      status: true,
      data: logicalGameResult,
    };
  }

  async validateGameResult(gameResultUpdate, logicalGameResult) {
    // validate check gameResult finished or paused
    if (gameResultUpdate.status === StatusGameResultEnum.FINISHED) {
      return { status: false, message: 'Game over' };
    }
    if (gameResultUpdate.status === StatusGameResultEnum.PAUSED) {
      return {
        status: false,
        message: 'Game was paused. You need to continue to play',
      };
    }
    // validate check play_time > total_game_time
    const validatePlayTime = this.validatePlayTime(gameResultUpdate);
    if (!validatePlayTime) {
      return {
        status: false,
        message: 'Gaming time is over. End game.',
      };
    }
    // validate check index_question_answer > total_question in game
    const totalQuestionGameLogical = parseInt(
      (
        await this.gameResultService.getGameInfoByGameResult(
          gameResultUpdate.id,
        )
      ).game.total_question,
    );
    if (logicalGameResult.index > totalQuestionGameLogical) {
      return {
        status: false,
        message: 'You have completed the game. End game.',
      };
    }
  }

  private async validatePlayTime(gameResultUpdate) {
    const newPlayTime = Date.now() - gameResultUpdate.time_start.getTime();
    const totalGameTime = (
      await this.gameResultService.getGameInfoByGameResult(gameResultUpdate.id)
    ).game.total_time;
    await this.gameResultService.updateGameResultWithPlayTime(
      gameResultUpdate.id,
      newPlayTime,
    );
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      await this.gameResultService.updateGameResultFinish(gameResultUpdate.id);
      return { status: false };
    }
    return { status: true };
  }

  async updateCorrectAnswer(gameResultUpdate, logicalResultPlaceHold) {
    const newPlayScore =
      gameResultUpdate.play_score +
      logicalResultPlaceHold.logical_question.score;
    await this.gameResultService.updateGameResultWithPlayScore(
      gameResultUpdate.id,
      newPlayScore,
    );
  }

  async checkCorrectAnswer(
    answerPlay: boolean,
    game_result_play_score: number,
    logicalGameResult: LogicalGameResult,
  ) {
    const isCorrectAnswer: boolean =
      answerPlay === logicalGameResult.logical_question.correct_answer;
    if (!!isCorrectAnswer) {
      const newPlayScore =
        game_result_play_score + logicalGameResult.logical_question.score;
      return {
        isCorrect: true,
        message: 'Your answer is true.',
        data: { newPlayScore },
      };
    }
    return {
      isCorrect: false,
      message: 'Your answer is false.',
    };
  }

  async getNextLogicalQuestion(
    logicalGameResult: LogicalGameResult,
    gameResultId: number,
  ) {
    // getLogicalGameResultByGameResult
    const logicalGameResultHistory: LogicalGameResult[] =
      await this.getHistoryAnswered(gameResultId);

    // validate except logical played and avoid 3 identical answer to get next logical_question
    const logicalExceptAndCheckIdenticalAnswer = {
      idLogicalListExcept: Object.values(logicalGameResultHistory).map(
        (obj) => obj.logical_question_id,
      ),
      checkIdenticalAnswer: Object.values(logicalGameResultHistory).map(
        (obj) => obj.logical_question.correct_answer,
      ),
    };
    const logicalQuestionRenderNext =
      await this.gameService.getLogicalQuestionRender(
        logicalExceptAndCheckIdenticalAnswer.idLogicalListExcept,
        logicalExceptAndCheckIdenticalAnswer.checkIdenticalAnswer,
      );
    const logicalGameResultRenderNext =
      await this.gameResultService.createLogicalGameResult({
        index: logicalGameResult.index + 1,
        game_result_id: logicalGameResult.game_result_id,
        logical_question_id: logicalQuestionRenderNext.id,
        status: StatusLogicalGameResultEnum.NO_ANSWER,
        answer_play: null,
        is_correct: null,
      });
    return {
      logicalQuestionRenderNext: {
        logicalGameResultId: logicalGameResultRenderNext.id,
        logicalQuestionId: logicalQuestionRenderNext.id,
        index: logicalGameResultRenderNext.index,
        statement1: logicalQuestionRenderNext.statement1,
        statement2: logicalQuestionRenderNext.statement2,
        conclusion: logicalQuestionRenderNext.conclusion,
        score: logicalQuestionRenderNext.score,
      },
    };
  }
}
