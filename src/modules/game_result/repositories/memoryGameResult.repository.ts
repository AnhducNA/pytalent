import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';

@Injectable()
export class MemoryGameResultRepository extends Repository<MemoryGameResult> {
  constructor(private dataSource: DataSource) {
    super(MemoryGameResult, dataSource.createEntityManager());
  }

  async insertData(payload: {
    gameResultId: number;
    memoryGameId: number;
    correctAnswer: string;
  }) {
    return await this.save({
      game_result_id: payload.gameResultId,
      memory_game_id: payload.memoryGameId,
      correct_answer: payload.correctAnswer,
      answer_play: null,
      is_correct: null,
      time_start_play_level: new Date(Date.now()),
    });
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

  async getByGameResultAndCandidate(gameResultId: number, candidateId: number) {
    return await this.find({
      where: {
        game_result_id: gameResultId,
        game_result: { candidate_id: candidateId },
      },
      order: { id: 'DESC' },
    });
  }

  async getAnswerCorrectByGameResult(gameResultId: number) {
    return await this.createQueryBuilder('memory_game_result')
      .select('memory_game_result.id')
      .addSelect('memory_game.score')
      .innerJoin('memory_game_result.memory_game', 'memory_game')
      .where(`memory_game_result.game_result_id = ${gameResultId}`)
      .andWhere(`memory_game_result.is_correct = 1`)
      .getMany();
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