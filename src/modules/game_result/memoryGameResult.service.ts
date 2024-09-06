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

  async getByGameResultIdAndCandidateId(
    gameResultId: number,
    candidateId: number,
  ) {
    return await this.memoryGameResultRepository.find({
      where: {
        game_result_id: gameResultId,
        game_result: { candidate_id: candidateId },
      },
      order: { id: 'DESC' },
    });
  }

  async updateAnswerPlay(id: number, answerPlay: string, isCorrect: boolean) {
    return await this.memoryGameResultRepository.update(id, {
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }
}
