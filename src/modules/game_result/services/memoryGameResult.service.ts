import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createMemoryGameResultInterface } from '@shared/interfaces/memoryGameResult.interface';
import { Repository } from 'typeorm';

@Injectable()
export class MemoryGameResultService {
  constructor(
    @InjectRepository(MemoryGameResult)
    private readonly memoryGameResultRepository: Repository<MemoryGameResult>,
  ) {}

  async getOneMemoryAnswer(id: number) {
    return this.memoryGameResultRepository.findOne({
      relations: ['memory_game'],
      where: { id },
    });
  }

  async create(payload: createMemoryGameResultInterface) {
    return await this.memoryGameResultRepository.save(payload);
  }

  async updateAnswerPlay(id: number, answerPlay: string, isCorrect: boolean) {
    return await this.memoryGameResultRepository.update(id, {
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }
}
