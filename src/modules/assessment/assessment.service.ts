import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '@entities/assessment.entity';
import { DeleteResult, Repository } from 'typeorm';
import { AssessmentGame } from '@entities/assessmentGame.entity';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';
import { CreateAssessmentInterface } from '@interfaces/assessment.interface';
import { GameResult } from '@entities/gameResult.entity';
import { AssessmentRepository } from './assessment.repository';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly assessmentRepository: AssessmentRepository,
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

  async getOne(id: number): Promise<Assessment> {
    return await this.assessmentRepository.findOne({
      select: ['id', 'time_end'],
      where: { id },
    });
  }

  async getOneAssessmentCandidate(assessmentId: number, candidateId: number) {
    return this.assessmentCandidateRepository.findOne({
      where: { assessment_id: assessmentId, candidate_id: candidateId },
    });
  }

  async getByHr(hrId: number) {
    const data = await this.assessmentRepository.find({
      where: { hr_id: hrId },
      order: { id: 'DESC' },
    });
    return data;
  }

  async getByCandidate(candidateId: number): Promise<
    {
      name: string;
      time_start: Date;
      time_end: Date;
    }[]
  > {
    await this.validateId(candidateId);
    const data = await this.assessmentRepository.find({
      select: ['id', 'name', 'time_start', 'time_end'],
      relations: ['games'],
      where: { candidates: { id: candidateId } },
    });
    return data;
  }

  async validateId(id: number) {
    if (!id) throw new BadRequestException('Id not found');
    return true;
  }
  async getWithGame(id: number) {
    return this.assessmentGameRepository
      .createQueryBuilder('assessment_game')
      .select('assessment_game.game_id')
      .where('assessment_id = :assessment_id', { assessment_id: id })
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

  async getCandidateByAssessmentId(assessment_id: number): Promise<any> {
    return await this.assessmentCandidateRepository
      .createQueryBuilder('assessment_candidate')
      .select('assessment_candidate.assessment_id')
      .addSelect(['user.id', 'user.name', 'user.email'])
      .innerJoin('assessment_candidate.candidate', 'user')
      .where('assessment_candidate.assessment_id = :assessment_id', {
        assessment_id: assessment_id,
      })
      .getMany();
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
    candidate_id_list: any;
  }) {
    if (params.game_id_list && params.game_id_list.length > 0) {
      await this.assessmentGameRepository
        .createQueryBuilder()
        .delete()
        .from(AssessmentGame)
        .where(`assessment_id = :assessment_id`, { assessment_id: params.id })
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
    if (params.candidate_id_list && params.candidate_id_list.length > 0) {
      await this.assessmentCandidateRepository
        .createQueryBuilder()
        .delete()
        .from(AssessmentCandidate)
        .where(`assessment_id = ${params.id} `)
        .execute();
      for (const candidate_id of params.candidate_id_list) {
        const payloadAssessmentCandidate = {
          assessment_id: params.id,
          candidate_id: candidate_id,
        };
        await this.assessmentGameRepository.save(payloadAssessmentCandidate);
      }
    }
    const assessment_initial = await this.findOne(params.id);
    const payloadAssessment = {
      id: params.id,
      name: params?.name ? params.name : assessment_initial.name,
      hr_id: params.hr_id ? params.hr_id : assessment_initial.hr_id,
      time_start: params.time_start
        ? params.time_start
        : assessment_initial.time_start,
      time_end: params.time_end ? params.time_end : assessment_initial.time_end,
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

  async get_assessment_candidate_exit(
    assessment_id: number,
    candidate_id: number,
  ) {
    return await this.assessmentCandidateRepository
      .createQueryBuilder()
      .where(`assessment_id = ${assessment_id}`)
      .andWhere(`candidate_id = ${candidate_id}`)
      .getOne();
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
