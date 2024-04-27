import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';
import { Assessment } from '@entities/assessment.entity';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
    @InjectRepository(LogicalGameResult)
    private logicalGameResultRepository: Repository<LogicalGameResult>,
    @InjectRepository(MemoryGameResult)
    private memoryGameResultRepository: Repository<MemoryGameResult>,
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(AssessmentCandidate)
    private assessmentCandidateRepository: Repository<AssessmentCandidate>,
  ) {}

  async findAll() {
    return await this.gameResultRepository.find();
  }

  async findOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async findOneAssessmentCandidate(
    assessment_id: number,
    candidate_id: number,
  ) {
    return await this.assessmentCandidateRepository.findOneBy({
      assessment_id: assessment_id,
      candidate_id: candidate_id,
    });
  }

  async create(params: object) {
    const payloadGameResult = {
      candidate_id: params['candidate_id'],
      assessment_id: params['assessment_id'],
      game_id: params['game_id'],
      play_time: params['play_time'],
      play_score: params['play_score'],
      is_done: params['is_done'],
    };
    return await this.gameResultRepository.save(payloadGameResult);
  }

  async deleteGameResultByAssessmentId(
    assessment_id: number,
  ): Promise<DeleteResult> {
    // delete assessment_candidate
    return await this.gameResultRepository
      .createQueryBuilder()
      .delete()
      .from(GameResult)
      .where(`assessment_id = ${assessment_id}`)
      .execute();
  }

  async getGameResultByCandidateId(candidateId: number) {
    return this.gameResultRepository.find({
      where: { candidate_id: candidateId },
    });
  }

  async get_assessment_by_id(assessment_id: number) {
    return await this.assessmentRepository
      .createQueryBuilder('assessment')
      .select('assessment.id')
      .addSelect('assessment.time_end')
      .where('assessment.id = :id', { id: assessment_id })
      .getOne();
  }

  async get_game_info_by_game_result(game_result_id: number) {
    return this.gameResultRepository
      .createQueryBuilder('game_result')
      .select('game_result.id', 'game_result_id')
      .leftJoinAndSelect('game_result.game', 'game')
      .where('game_result.id = :id', { id: game_result_id })
      .getOne();
  }

  async getLogicalGameResultByGameResultIdAndCandidateId(
    game_result_id: number,
    candidate_id: number,
  ) {
    const query = this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .innerJoin('logical_game_result.gameResult', 'game_result')
      .orderBy('logical_game_result.id', 'DESC')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .andWhere(`game_result.candidate_id = ${candidate_id}`)
      .getMany();
    return query;
  }

  async getMemoryGameResultByGameResultIdAndCandidateId(
    game_result_id: number,
    candidate_id: number,
  ) {
    const query = this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .innerJoin('memory_game_result.gameResults', 'game_result')
      .orderBy('memory_game_result.id', 'DESC')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .andWhere(`game_result.candidate_id = ${candidate_id}`)
      .getMany();
    return query;
  }

  async get_memory_game_result_by_game_result_id(game_result_id: number) {
    const query = this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select('memory_game_result.id')
      .addSelect('memory_game_result.memory_game_id')
      .addSelect('memory_game_result.correct_answer')
      .addSelect('memory_game_result.answer_play')
      .addSelect('memory_game_result.is_correct')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .getMany();
    return query;
  }

  async updateGameResult(payload: {
    id: number;
    candidate_id: number;
    assessment_id: number;
    game_id: number;
    play_time: number;
    play_score: number;
    is_done: boolean;
  }) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set(payload)
      .where('id = :id', { id: payload.id })
      .execute();
  }

  async updateIsDoneGameResult(id: number) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        is_done: true,
      })
      .where('id = :id', { id: id })
      .execute();
  }

  async updateGameResultPlayTimeAndScore(payload: {
    id: number;
    play_time: number;
    play_score: number;
  }) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({ play_time: payload.play_time, play_score: payload.play_score })
      .where('id = :id', { id: payload.id })
      .execute();
  }

  async createLogicalGameResult(payload: {
    game_result_id: number;
    logical_game_id: number;
    correct_answer: boolean;
    answer_play: boolean;
    is_correct: boolean;
  }) {
    return await this.logicalGameResultRepository.save(payload);
  }

  async createMemoryGameResult(payload: {
    game_result_id: number;
    memory_game_id: number;
    answer_play: string;
    correct_answer: string;
    is_correct: boolean;
  }) {
    return await this.memoryGameResultRepository.save(payload);
  }
}
