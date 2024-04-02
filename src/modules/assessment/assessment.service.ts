import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '@entities/assessment.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { AssessmentGame } from '@entities/assessmentGame.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentGame)
    private readonly assessmentGameRepository: Repository<AssessmentGame>,
  ) {}

  async findAll(): Promise<Assessment[]> {
    return this.assessmentRepository.find();
  }

  async findOne(id: number): Promise<Assessment> {
    return await this.assessmentRepository.findOneBy({ id: id });
  }

  async create(params: object) {
    const payloadAssessment = {
      id: params['id'],
      name: params['name'],
      hr_id: params['hr_id'],
      candidate_id: params['candidate_id'],
      time_start: params['time_start'],
    };
    const assessmentResult = await this.assessmentRepository.save(
      payloadAssessment,
    );
    if (params['game_id']) {
      params['game_id'].map(async (game_id: string) => {
        const paramsAssessmentGame = {
          assessment_id: assessmentResult.id,
          game_id: parseInt(game_id),
        };
        await this.assessmentGameRepository
          .createQueryBuilder()
          .delete()
          .from(AssessmentGame)
          .where(
            `assessment_id = ${paramsAssessmentGame.assessment_id} && game_id = ${paramsAssessmentGame.game_id}`,
          )
          .execute();
        await this.assessmentGameRepository.save(paramsAssessmentGame);
      });
    }
    return assessmentResult;
  }

  async update(params: object) {
    const payloadAssessment = {
      id: params['id'],
      name: params['name'],
      hr_id: params['hr_id'],
      candidate_id: params['candidate_id'],
      time_start: params['time_start'],
    };
    const assessmentResult = await this.assessmentRepository.update(
      payloadAssessment.id,
      payloadAssessment,
    );
    if (params['game_id']) {
      params['game_id'].map(async (game_id: string) => {
        const paramsAssessmentGame = {
          assessment_id: payloadAssessment.id,
          game_id: parseInt(game_id),
        };
        await this.assessmentGameRepository
          .createQueryBuilder()
          .delete()
          .from(AssessmentGame)
          .where(
            `assessment_id = ${paramsAssessmentGame.assessment_id} && game_id = ${paramsAssessmentGame.game_id}`,
          )
          .execute();
        await this.assessmentGameRepository.save(paramsAssessmentGame);
      });
    }
    return assessmentResult;
  }

  async delete(id): Promise<DeleteResult> {
    return await this.assessmentRepository.delete(id);
  }
}
