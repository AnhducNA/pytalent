import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/LogicalGameResult.entity';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
    @InjectRepository(LogicalGameResult)
    private logicalGameResultRepository: Repository<LogicalGameResult>,
  ) {}

  async findAll() {
    return await this.gameResultRepository.find();
  }

  async findOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async create(params: object) {
    const payloadGameResult = {
      candidate_id: params['candidate_id'],
      assessment_id: params['assessment_id'],
      game_id: params['game_id'],
      play_time: params['play_time'],
      play_score: params['play_score'],
      is_done: params['is_done'],
    };
    return await this.gameResultRepository.save(payloadGameResult);
  }

  async updateGameResult(payload: {
    id: number;
    candidate_id: number;
    assessment_id: number;
    game_id: number;
    play_time: number;
    play_score: number;
    is_done: boolean;
  }) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set(payload)
      .where('id = :id', { id: payload.id })
      .execute();
  }
  async updateGameResultPlayTimeAndScore(payload: {
    id: number;
    play_time: number;
    play_score: number;
  }) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({ play_time: payload.play_time, play_score: payload.play_score })
      .where('id = :id', { id: payload.id })
      .execute();
  }

  async createLogicalGameResult(payload: {
    game_result_id: number;
    logical_game_id: number;
    answer: boolean;
  }) {
    return await this.logicalGameResultRepository.save(payload);
  }
}
