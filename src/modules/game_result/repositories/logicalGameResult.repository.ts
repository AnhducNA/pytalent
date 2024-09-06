import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class LogicalGameResultRepository extends Repository<LogicalGameResult> {
  constructor(private dataSource: DataSource) {
    super(LogicalGameResult, dataSource.createEntityManager());
  }

  async getLogicalAnswerCorrectByGameResult(gameResultId: number) {
    return await this.createQueryBuilder('logical_game_result')
      .select('logical_game_result.id')
      .addSelect('logical_question.score')
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${gameResultId}`)
      .andWhere(`logical_game_result.is_correct = 1`)
      .getMany();
  }

  async getByGameResultAndCandidate(gameResultId: number, candidateId: number) {
    return await this.find({
      relations: ['game_result'],
      where: {
        game_result_id: gameResultId,
        game_result: { candidate_id: candidateId },
      },
      order: { id: 'DESC' },
    });
  }
}
