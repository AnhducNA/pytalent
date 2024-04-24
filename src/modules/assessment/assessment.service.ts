import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '@entities/assessment.entity';
import { DeleteResult, Repository } from 'typeorm';
import { AssessmentGame } from '@entities/assessmentGame.entity';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';
import { CreateAssessmentInterface } from '@interfaces/assessment.interface';
import { GameResult } from '@entities/gameResult.entity';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentGame)
    private readonly assessmentGameRepository: Repository<AssessmentGame>,
    @InjectRepository(AssessmentCandidate)
    private readonly assessmentCandidateRepository: Repository<AssessmentCandidate>,
    @InjectRepository(GameResult)
    private readonly gameResultRepository: Repository<GameResult>,
  ) {}

  async findAll(): Promise<Assessment[]> {
    return this.assessmentRepository.find();
  }

  async getAssessmentByHrId(hr_id: number) {
    return this.assessmentRepository
      .createQueryBuilder('assessment')
      .where('hr_id = :hr_id', { hr_id: hr_id })
      .getMany();
  }

  async getAssessmentGameByAssessmentId(assessment_id: number) {
    return this.assessmentGameRepository
      .createQueryBuilder('assessment_game')
      .select('assessment_game.game_id')
      .where('assessment_id = :assessment_id', { assessment_id: assessment_id })
      .getMany();
  }
  async get_assessment_candidate_and_game_result_by_assessment_id(
    assessment_id: number,
  ) {
    return this.assessmentCandidateRepository
      .createQueryBuilder('assessment_candidate')
      .select('assessment_candidate.candidate_id')
      .where('assessment_id = :assessment_id', { assessment_id: assessment_id })
      .getMany();
  }

  async findOne(id: number) {
    return await this.assessmentRepository.findOneBy({ id: id });
  }

  async getGameResultByAssessmentId(assessment_id: number) {
    return this.gameResultRepository.find({
      where: { assessment_id: assessment_id },
    });
  }

  async getGameByAssessmentId(assessment_id: number): Promise<any> {
    return await this.assessmentGameRepository
      .createQueryBuilder('assessment_game')
      .select('assessment_game.assessment_id')
      .leftJoinAndSelect('assessment_game.game', 'game')
      .where('assessment_game.assessment_id = :assessment_id', {
        assessment_id: assessment_id,
      })
      .getMany();
  }

  async create(params: {
    name: string;
    hr_id: number;
    game_list: any;
    candidate_list: any;
    time_start: Date;
    time_end: Date;
  }) {
    const payloadAssessment: CreateAssessmentInterface = {
      name: params.name,
      hr_id: params.hr_id,
      time_start: params.time_start,
      time_end: params.time_end,
    };
    const assessmentResult = await this.assessmentRepository.save(
      payloadAssessment,
    );
    if (params.game_list) {
      params.game_list.map(async (game_id: number) => {
        const payloadAssessmentGame = {
          assessment_id: assessmentResult.id,
          game_id: game_id,
        };
        await this.assessmentGameRepository.save(payloadAssessmentGame);
      });
    }
    if (params.candidate_list) {
      params.candidate_list.map(async (candidate_id: number) => {
        const payloadAssessmentCandidate = {
          assessment_id: assessmentResult.id,
          candidate_id: candidate_id,
        };
        await this.assessmentCandidateRepository.save(
          payloadAssessmentCandidate,
        );
      });
    }
    return assessmentResult;
  }

  async update(params: {
    id: number;
    name: string;
    hr_id: number;
    time_start: string;
    time_end: string;
    game_id_list: any;
    candidate_email_list: any;
  }) {
    if (params.game_id_list) {
      await this.assessmentGameRepository
        .createQueryBuilder()
        .delete()
        .from(AssessmentGame)
        .where(`assessment_id = ${params.id} `)
        .execute();
      for (const game_id of params.game_id_list) {
        const payloadAssessmentGame = {
          assessment_id: params.id,
          game_id: parseInt(game_id),
        };
        await this.assessmentGameRepository
          .createQueryBuilder()
          .insert()
          .into(AssessmentGame)
          .values([
            {
              assessment_id: payloadAssessmentGame.assessment_id,
              game_id: payloadAssessmentGame.game_id,
            },
          ])
          .execute();
      }
    }
    if (params.candidate_email_list) {
      await this.assessmentCandidateRepository
        .createQueryBuilder()
        .delete()
        .from(AssessmentCandidate)
        .where(`assessment_id = ${params.id} `)
        .execute();
      for (const candidate_email of params.candidate_email_list) {
        const payloadAssessmentCandidate = {
          assessment_id: params.id,
          candidate_email: candidate_email,
        };
        await this.assessmentGameRepository.save(payloadAssessmentCandidate);
      }
    }
    const payloadAssessment = {
      id: params.id,
      name: params.name,
      hr_id: params.hr_id,
      time_start: params.time_start,
      time_end: params.time_end,
    };
    return await this.assessmentRepository.update(
      payloadAssessment.id,
      payloadAssessment,
    );
  }

  async delete_assessment_candidate_by_assessment_id(assessment_id: number) {
    return await this.assessmentCandidateRepository
      .createQueryBuilder('assessment_candidate')
      .delete()
      .where('assessment_id = :assessment_id', { assessment_id: assessment_id })
      .execute();
  }

  async create_assessment_candidate(assessment_candidate: {
    assessment_id: number;
    candidate_id: number;
  }) {
    return await this.assessmentCandidateRepository
      .createQueryBuilder('assessment_candidate')
      .insert()
      .into(AssessmentCandidate)
      .values([
        {
          assessment_id: assessment_candidate.assessment_id,
          candidate_id: assessment_candidate.candidate_id,
        },
      ])
      .execute();
  }

  async delete(id: number): Promise<DeleteResult> {
    // delete assessment_candidate
    await this.assessmentCandidateRepository
      .createQueryBuilder()
      .delete()
      .from(AssessmentCandidate)
      .where(`assessment_id = ${id}`)
      .execute();
    // delete assessment_game
    await this.assessmentGameRepository
      .createQueryBuilder()
      .delete()
      .from(AssessmentGame)
      .where(`assessment_id = ${id}`)
      .execute();
    // delete assessment_game
    await this.assessmentGameRepository
      .createQueryBuilder()
      .delete()
      .from(AssessmentGame)
      .where(`assessment_id = ${id} `)
      .execute();
    // delete assessment
    return await this.assessmentRepository.delete(id);
  }
}
