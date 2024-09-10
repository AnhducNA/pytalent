import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { IcreateLogicalGameResult } from '@shared/interfaces/logicalGameResult.interface';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class LogicalGameResultRepository extends Repository<LogicalGameResult> {
  constructor(private dataSource: DataSource) {
    super(LogicalGameResult, dataSource.createEntityManager());
  }

  async getOne(id: number): Promise<LogicalGameResult> {
    const data = await this.findOne({
      where: { id },
      relations: ['logical_question'],
    });
    if (!data) {
      throw new BadRequestException('Logical answer does not exit');
    }
    return data;
  }
  async createLogicalAnswer(payload: IcreateLogicalGameResult) {
    return await this.save(payload);
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

  async getLogicalAnswerFinalByGameResult(gameResultId: number) {
    return this.findOne({
      relations: ['logical_game_result'],
      where: { game_result_id: gameResultId },
      order: { game_result_id: 'DESC' },
    });
  }

  async updateStatusAnswered(
    id: number,
    answerPlay: boolean,
    isCorrect: boolean,
  ) {
    return await this.update(id, {
      status: StatusLogicalGameResultEnum.ANSWERED,
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }
}
