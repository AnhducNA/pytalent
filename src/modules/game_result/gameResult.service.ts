import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { Repository } from 'typeorm';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { createLogicalGameResultInterface } from '@shared/interfaces/logicalGameResult.interface';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
    @InjectRepository(LogicalGameResult)
    private readonly logicalGameResultRepository: Repository<LogicalGameResult>,
  ) {}

  async getAll(): Promise<GameResult[]> {
    return await this.gameResultRepository.find();
  }

  async getOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOne({ where: { id } });
  }

  async getLogicalGameResultItem(logical_game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select([
        'logical_game_result.id',
        'logical_game_result.index',
        'logical_game_result.game_result_id',
        'logical_game_result.status',
        'logical_game_result.answer_play',
        'logical_game_result.is_correct',
      ])
      .addSelect([
        'logical_question.id',
        'logical_question.statement1',
        'logical_question.statement2',
        'logical_question.conclusion',
        'logical_question.score',
        'logical_question.correct_answer',
      ])
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.id = ${logical_game_result_id}`)
      .getOne();
  }

  async getHistoryAnswered(gameResultId: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select([
        'logical_game_result.id',
        'logical_game_result.index',
        'logical_game_result.game_result_id',
        'logical_game_result.logical_question_id',
        'logical_game_result.status',
        'logical_game_result.answer_play',
        'logical_game_result.is_correct',
      ])
      .addSelect('logical_question.correct_answer')
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${gameResultId}`)
      .getMany();
  }

  async getGameInfoByGameResult(game_result_id: number) {
    return this.gameResultRepository
      .createQueryBuilder('game_result')
      .select('game_result.id', 'game_result_id')
      .addSelect(['game.total_time', 'game.total_question'])
      .innerJoin('game_result.game', 'game')
      .where('game_result.id = :id', { id: game_result_id })
      .getOne();
  }
  async updateGameResultWithPlayTime(
    game_result_id: number,
    play_time: number,
  ) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        play_time: play_time,
      })
      .where('id = :id', { id: game_result_id })
      .execute();
  }
  async updateGameResultWithPlayScore(gameResultId: number, playScore: number) {
    const gameResult = await this.gameResultRepository.findOne({
      where: { id: gameResultId },
    });
    gameResult.play_score = playScore;
    return this.gameResultRepository.save(gameResult);
  }
  async updateGameResultFinish(gameResultId: number) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        status: StatusGameResultEnum.FINISHED,
      })
      .where('id = :id', { id: gameResultId })
      .execute();
  }
  async updateAnsweredLogicalGameResult(
    logical_game_result_id: number,
    answer_play: boolean,
    is_correct: boolean,
  ) {
    return await this.logicalGameResultRepository
      .createQueryBuilder()
      .update(LogicalGameResult)
      .set({
        status: StatusLogicalGameResultEnum.ANSWERED,
        answer_play: answer_play,
        is_correct: is_correct,
      })
      .where('id = :id', { id: logical_game_result_id })
      .execute();
  }

  async createLogicalGameResult(payload: createLogicalGameResultInterface) {
    return await this.logicalGameResultRepository.create(payload);
  }
}
