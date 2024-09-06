import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MemoryGameResultService {
  constructor(
    @InjectRepository(MemoryGameResult)
    private readonly memoryGameResultRepository: Repository<MemoryGameResult>,
  ) {}

  async getAnswerCorrectByGameResult(gameResultId: number) {
    return await this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select('memory_game_result.id')
      .addSelect('memory_game.score')
      .innerJoin('memory_game_result.memory_game', 'memory_game')
      .where(`memory_game_result.game_result_id = ${gameResultId}`)
      .andWhere(`memory_game_result.is_correct = 1`)
      .getMany();
  }
}
