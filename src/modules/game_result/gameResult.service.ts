import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
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
  ) {}

  async findAll() {
    return await this.gameResultRepository.find();
  }

  async findOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async findAndValidateGameResult(id: number): Promise<GameResult> {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: GameResult = await this.gameResultRepository.findOne({
      select: ['id', 'status', 'time_start', 'play_score', 'play_time'],
      where: { id },
    });
    // validate check gameResult finished or paused
    if (gameResult.status === StatusGameResultEnum.FINISHED) {
      throw new BadRequestException('Game completed');
    }
    if (gameResult.status === StatusGameResultEnum.PAUSED) {
      throw new BadRequestException(
        'Game was paused. You need to continue to play',
      );
    }

    // validate check play_time > total_game_time
    const validatePlayTime: boolean = await this.validatePlayTime(
      id,
      gameResult.time_start,
    );

    if (!validatePlayTime) {
      throw new BadRequestException(`Game's time is over.`);
    }

    return gameResult;
  }

  private async validatePlayTime(gameResultId: number, timeStart: Date) {
    const newPlayTime = Date.now() - timeStart.getTime();
    const totalGameTime = (await this.getGameInfoByGameResult(gameResultId))
      .game.total_time;
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      return false;
    }
    return true;
  }

  async getGameResultOfCandidate(candidateId: number) {
    const gameResultList = await this.gameResultRepository.find({
      where: { candidate_id: candidateId },
    });
    await Promise.all(
      gameResultList.map(async (gameResult) => {
        gameResult.play_score = await this.get_total_play_score_by_game_result(
          gameResult.id,
          gameResult.game_id,
        );
      }),
    );
    return gameResultList;
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

  async check_game_result_play_time_finish() {
    const game_result_playing_list = await this.gameResultRepository
      .createQueryBuilder('game_result')
      .select([
        'game_result.id',
        'game_result.time_start',
        'game_result.game_id',
      ])
      .addSelect('game.total_time')
      .innerJoin('game_result.game', 'game')
      .where('game_result.status IN (:...status_list)', {
        status_list: [
          StatusGameResultEnum.STARTED,
          StatusGameResultEnum.PAUSED,
        ],
      })
      .getMany();
    game_result_playing_list.map((game_result_playing) => {
      switch (game_result_playing.game_id) {
        case 1:
          if (
            Date.now() - game_result_playing.time_start.getTime() >
            game_result_playing.game.total_time
          ) {
            this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
        case 2:
          if (Date.now() - game_result_playing.time_start.getTime() > 100000) {
            this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
      }
    });
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

  async getGameInfoByGameResult(game_result_id: number) {
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

  async getLogicalGameResultFinalByGameResult(gameResultId: number) {
    return this.logicalGameResultRepository.findOne({
      relations: ['logical_game_result'],
      where: { game_result_id: gameResultId },
      order: { game_result_id: 'DESC' },
    });
  }

  async getMemoryGameResultByGameResultIdAndCandidateId(
    gameResultId: number,
    candidate_id: number,
  ) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .innerJoin('memory_game_result.game_result', 'game_result')
      .orderBy('memory_game_result.id', 'DESC')
      .where(`memory_game_result.game_result_id = ${gameResultId}`)
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

  async updateTimeStartGameResult(id: number, timeStart: Date) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        time_start: timeStart,
      })
      .where('id = :id', { id: id })
      .execute();
  }
  async updateFinishGame(gameResultId: number) {
    return this.gameResultRepository
      .createQueryBuilder()
      .update(GameResult)
      .set({
        status: StatusGameResultEnum.FINISHED,
      })
      .where('id = :id', { id: gameResultId })
      .execute();
  }

  async updateGameResultWithStatus(
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

  async updateGameResultWithPlayTime(
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
  async updateGameResultWithPlayScore(gameResultId: number, playScore: number) {
    return this.gameResultRepository.save({
      id: gameResultId,
      play_score: playScore,
    });
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

  async updateLogicalAnswered(
    logical_game_result_id: number,
    answer_play: boolean,
    is_correct: boolean,
  ) {
    return await this.logicalGameResultRepository
      .createQueryBuilder()
      .update(LogicalGameResult)
      .set({
        status: StatusLogicalGameResultEnum.ANSWERED,
        answer_play: answer_play,
        is_correct: is_correct,
      })
      .where('id = :id', { id: logical_game_result_id })
      .execute();
  }

  async createLogicalGameResult(payload: createLogicalGameResultInterface) {
    return await this.logicalGameResultRepository.save(payload);
  }

  async updateAnswerPlayLogicalGameResult(
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
