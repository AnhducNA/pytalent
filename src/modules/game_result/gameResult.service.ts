import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
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
}
