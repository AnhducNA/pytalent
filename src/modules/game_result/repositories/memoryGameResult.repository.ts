import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';

@Injectable()
export class MemoryGameResultRepository extends Repository<MemoryGameResult> {
  constructor(private dataSource: DataSource) {
    super(MemoryGameResult, dataSource.createEntityManager());
  }

  async getByGameResult(gameResultId: number) {
    return await this.find({
      select: [
        'id',
        'memory_game_id',
        'correct_answer',
        'answer_play',
        'is_correct',
      ],
      where: { game_result_id: gameResultId },
    });
  }
  async updateTimeStartPlayLevel(id: number) {
    return await this.update(id, {
      time_start_play_level: new Date(Date.now()),
    });
  }

  async updateCorrectAnswer(id: number, correctAnswer: string) {
    return await this.update(id, {
      correct_answer: correctAnswer,
    });
  }

  async getFinalByGameResult(gameResultId: number) {
    return this.findOne({
      relations: ['memory_game'],
      where: { game_result_id: gameResultId },
      order: { id: 'DESC' },
    });
  }
}
