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
import { createMemoryGameResultInterface } from '@interfaces/memoryGameResult.interface';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';

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

  async get_total_play_score_by_game_result(
    game_result_id: number,
    game_id: number,
  ) {
    let game_result_play_score = 0;
    switch (game_id) {
      case 1:
        const logical_game_result_list = await this.logicalGameResultRepository
          .createQueryBuilder('logical_game_result')
          .select('logical_game_result.id')
          .addSelect('logical_question.score')
          .innerJoin('logical_game_result.logical_question', 'logical_question')
          .where(`logical_game_result.game_result_id = ${game_result_id}`)
          .andWhere(`logical_game_result.is_correct = 1`)
          .getMany();
        logical_game_result_list.map((item) => {
          game_result_play_score += item.logical_question.score;
        });
        break;
      case 2:
        const memory_game_result_list = await this.memoryGameResultRepository
          .createQueryBuilder('memory_game_result')
          .select('memory_game_result.id')
          .addSelect('memory_game.score')
          .innerJoin('memory_game_result.memory_game', 'memory_game')
          .where(`memory_game_result.game_result_id = ${game_result_id}`)
          .andWhere(`memory_game_result.is_correct = 1`)
          .getMany();
        memory_game_result_list.map((item) => {
          game_result_play_score += item.memory_game.score;
        });
        break;
    }
    return game_result_play_score;
  }

  async get_history_type_game_result_by_game_result(game_result_id: number) {
    return this.gameResultRepository
      .createQueryBuilder('game_result')
      .select([
        'game_result.id',
        'game_result.candidate_id',
        'game_result.assessment_id',
        'game_result.game_id',
        'game_result.play_time',
        'game_result.play_score',
        'game_result.status',
        'game_result.time_start',
      ])
      .leftJoinAndSelect(
        'game_result.logical_game_result_list',
        'logical_game_result',
      )
      .leftJoinAndSelect(
        'game_result.memory_game_result_list',
        'memory_game_result',
      )
      .where('game_result.id = :id', { id: game_result_id })
      .getMany();
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
      .innerJoin('logical_game_result.game_result', 'game_result')
      .orderBy('logical_game_result.id', 'DESC')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .andWhere(`game_result.candidate_id = ${candidate_id}`)
      .getMany();
  }

  async get_logical_game_result_all_by_game_result(game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select([
        'logical_game_result.id',
        'logical_game_result.index',
        'logical_game_result.game_result_id',
        'logical_game_result.logical_question_id',
        'logical_game_result.status',
        'logical_game_result.answer_play',
        'logical_game_result.is_correct',
      ])
      .addSelect('logical_question.correct_answer')
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .getMany();
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

  async get_logical_game_result_final_by_game_result(game_result_id: number) {
    return this.logicalGameResultRepository
      .createQueryBuilder('logical_game_result')
      .select([
        'logical_game_result.id',
        'logical_game_result.logical_question_id',
      ])
      .addSelect([
        'logical_question.statement1',
        'logical_question.statement2',
        'logical_question.conclusion',
        'logical_question.score',
      ])
      .innerJoin('logical_game_result.logical_question', 'logical_question')
      .where(`logical_game_result.game_result_id = ${game_result_id}`)
      .orderBy('logical_game_result.id', 'DESC')
      .getOne();
  }

  async getMemoryGameResultByGameResultIdAndCandidateId(
    game_result_id: number,
    candidate_id: number,
  ) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .innerJoin('memory_game_result.game_result', 'game_result')
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

  async get_memory_game_result_by_id(memory_game_result_id: number) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select([
        'memory_game_result.id',
        'memory_game_result.game_result_id',
        'memory_game_result.memory_game_id',
        'memory_game_result.correct_answer',
        'memory_game_result.answer_play',
        'memory_game_result.is_correct',
        'memory_game_result.time_start_play_level',
      ])
      .addSelect([
        'memory_game.level',
        'memory_game.score',
        'memory_game.time_limit',
      ])
      .innerJoin('memory_game_result.memory_game', 'memory_game')
      .where(`memory_game_result.id = ${memory_game_result_id}`)
      .getOne();
  }

  async get_memory_game_result_final_by_game_result(game_result_id: number) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select([
        'memory_game_result.id',
        'memory_game_result.memory_game_id',
        'memory_game_result.correct_answer',
        'memory_game_result.answer_play',
        'memory_game_result.is_correct',
      ])
      .addSelect([
        'memory_game.level',
        'memory_game.score',
        'memory_game.time_limit',
      ])
      .innerJoin('memory_game_result.memory_game', 'memory_game')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .orderBy('memory_game_result.id', 'DESC')
      .getOne();
  }

  async update_memory_game_result_time_start_play_level_final_by_id(
    memory_game_result_id: number,
  ) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .update(MemoryGameResult)
      .set({ time_start_play_level: new Date(Date.now()) })
      .where(`memory_game_result.id = ${memory_game_result_id}`)
      .execute();
  }

  async update_memory_game_result_correct_answer_by_id(
    memory_game_result_id: number,
    correct_answer: string,
  ) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .update(MemoryGameResult)
      .set({ correct_answer: correct_answer })
      .where(`memory_game_result.id = ${memory_game_result_id}`)
      .execute();
  }

  async updateGameResult(payload: gameResultModel) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set(payload)
      .where('id = :id', { id: payload.id })
      .execute();
  }

  async updateTimeStartGameResult(id: number, time_start: Date) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        time_start: time_start,
      })
      .where('id = :id', { id: id })
      .execute();
  }

  async update_game_result_status(
    game_result_id: number,
    status: StatusGameResultEnum,
  ) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        status: status,
      })
      .where('id = :id', { id: game_result_id })
      .execute();
  }

  async update_game_result_play_time(
    game_result_id: number,
    play_time: number,
  ) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        play_time: play_time,
      })
      .where('id = :id', { id: game_result_id })
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

  async createMemoryGameResult(payload: createMemoryGameResultInterface) {
    return await this.memoryGameResultRepository.save(payload);
  }

  async update_answer_play_memory_game_result(
    memory_game_result_id: number,
    answer_play: string,
    is_correct: boolean,
  ) {
    return await this.logicalGameResultRepository
      .createQueryBuilder()
      .update(MemoryGameResult)
      .set({
        answer_play: answer_play,
        is_correct: is_correct,
      })
      .where('id = :id', { id: memory_game_result_id })
      .execute();
  }

  async delete_game_result_by_id(game_result_id: number) {
    return this.gameResultRepository.delete(game_result_id);
  }
}
