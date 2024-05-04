import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';
import { Assessment } from '@entities/assessment.entity';
import { createLogicalGameResultInterface } from '@interfaces/logicalGameResult.interface';
import {
  createGameResultInterface,
  gameResultModel,
} from '@interfaces/gameResult.interface';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';

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

  async create(payloadGameResult: createGameResultInterface) {
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

  async get_game_result_exist_check(
    candidate_id: number,
    assessment_id: number,
    game_id: number,
  ) {
    return this.gameResultRepository
      .createQueryBuilder()
      .where(`candidate_id = ${candidate_id}`)
      .andWhere(`assessment_id = ${assessment_id}`)
      .andWhere(`game_id = ${game_id}`)
      .getOne();
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
      .addSelect(['game.total_time', 'game.total_question'])
      .innerJoin('game_result.game', 'game')
      .where('game_result.id = :id', { id: game_result_id })
      .getOne();
  }

  async getLogicalGameResultByGameResultIdAndCandidateId(
    game_result_id: number,
    candidate_id: number,
  ) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .innerJoin('logical_game_result.gameResult', 'game_result')
      .orderBy('logical_game_result.id', 'DESC')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .andWhere(`game_result.candidate_id = ${candidate_id}`)
      .getMany();
  }

  async get_logical_game_result_all_by_game_result(game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select('logical_game_result.*')
      .addSelect('logical_question.correct_answer')
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .getMany();
  }

  async get_count_logical_game_result_all_by_game_result(
    game_result_id: number,
  ) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .getCount();
  }

  async get_logical_game_result_item(logical_game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select([
        'logical_game_result.id',
        'logical_game_result.index',
        'logical_game_result.game_result_id',
        'logical_game_result.status',
        'logical_game_result.answer_play',
        'logical_game_result.is_correct',
      ])
      .addSelect([
        'logical_question.id',
        'logical_question.statement1',
        'logical_question.statement2',
        'logical_question.conclusion',
        'logical_question.score',
        'logical_question.correct_answer',
      ])
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.id = ${logical_game_result_id}`)
      .getOne();
  }

  async get_logical_game_result_by_game_result(game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select('logical_game_result.logical_question_id')
      .addSelect(['logical_question.correct_answer'])
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .getMany();
  }

  async getMemoryGameResultByGameResultIdAndCandidateId(
    game_result_id: number,
    candidate_id: number,
  ) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .innerJoin('memory_game_result.gameResults', 'game_result')
      .orderBy('memory_game_result.id', 'DESC')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .andWhere(`game_result.candidate_id = ${candidate_id}`)
      .getMany();
  }

  async get_memory_game_result_by_game_result_id(game_result_id: number) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select('memory_game_result.id')
      .addSelect('memory_game_result.memory_game_id')
      .addSelect('memory_game_result.correct_answer')
      .addSelect('memory_game_result.answer_play')
      .addSelect('memory_game_result.is_correct')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .getMany();
  }

  async get_count_memory_game_result_by_game_result(game_result_id: number) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .getCount();
  }

  async updateGameResult(payload: gameResultModel) {
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

  async createLogicalGameResult(payload: createLogicalGameResultInterface) {
    return await this.logicalGameResultRepository.save(payload);
  }

  async update_answer_play_logical_game_result(
    logical_game_result_id: number,
    status: StatusLogicalGameResultEnum,
    answer_play: boolean,
    is_correct: boolean,
  ) {
    return await this.logicalGameResultRepository
      .createQueryBuilder()
      .update(LogicalGameResult)
      .set({
        status: status,
        answer_play: answer_play,
        is_correct: is_correct,
      })
      .where('id = :id', { id: logical_game_result_id })
      .execute();
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

  async delete_game_result_by_id(game_result_id: number) {
    return this.gameResultRepository.delete(game_result_id);
  }
}
