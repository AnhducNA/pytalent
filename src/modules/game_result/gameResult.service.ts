import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { createGameResultInterface } from '@interfaces/gameResult.interface';
import { createMemoryGameResultInterface } from '@interfaces/memoryGameResult.interface';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { MemoryGameResultService } from './memoryGameResult.service';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';

@Injectable()
export class GameResultService {
  constructor(
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
    @InjectRepository(MemoryGameResult)
    private memoryGameResultRepository: Repository<MemoryGameResult>,
    private logicalAnswerRepository: LogicalGameResultRepository,
    private memoryAnswerService: MemoryGameResultService,
  ) {}

  async findAll() {
    return await this.gameResultRepository.find();
  }

  async findOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async delete(id: number) {
    return this.gameResultRepository.delete(id);
  }

  async findAndValidateGameResult(id: number): Promise<GameResult> {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: GameResult = await this.findOne(id);
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

  async validatePlayTime(gameResultId: number, timeStart: Date) {
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
        gameResult.play_score = await this.getTotalPlayScoreByGameResult(
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
    game_result_playing_list.map(async (game_result_playing) => {
      switch (game_result_playing.game_id) {
        case 1:
          if (
            Date.now() - game_result_playing.time_start.getTime() >
            game_result_playing.game.total_time
          ) {
            await this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
        case 2:
          if (Date.now() - game_result_playing.time_start.getTime() > 100000) {
            await this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
      }
    });
  }

  async getTotalPlayScoreByGameResult(gameResultId: number, gameId: number) {
    let totalPlayScore = 0;
    switch (gameId) {
      case 1:
        const logicalAnswerList =
          await this.logicalAnswerRepository.getLogicalAnswerCorrectByGameResult(
            gameResultId,
          );
        logicalAnswerList.map((item) => {
          totalPlayScore += item.logical_question.score;
        });
        return totalPlayScore;
        break;
      case 2:
        const memoryAnswerList =
          await this.memoryAnswerService.getAnswerCorrectByGameResult(
            gameResultId,
          );
        memoryAnswerList.map((item) => {
          totalPlayScore += item.memory_game.score;
        });
        return totalPlayScore;
        break;
      default: {
        return totalPlayScore;
        break;
      }
    }
  }

  async get_history_type_game_result_by_game_result(id: number) {
    return this.gameResultRepository.find({
      relations: ['logical_game_result_list', 'memory_game_result_list'],
      where: { id },
    });
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

  async getMemoryGameResultByGameResultIdAndCandidateId(
    gameResultId: number,
    candidateId: number,
  ) {
    return this.memoryGameResultRepository.find({
      where: {
        game_result_id: gameResultId,
        game_result: { candidate_id: candidateId },
      },
      order: { id: 'DESC' },
    });
  }

  async get_memory_game_result_by_game_result_id(gameResulttId: number) {
    return await this.memoryGameResultRepository.find({
      select: [
        'id',
        'memory_game_id',
        'correct_answer',
        'answer_play',
        'is_correct',
      ],
      where: { game_result_id: gameResulttId },
    });
  }

  async get_memory_game_result_by_id(id: number) {
    return this.memoryGameResultRepository.findOne({
      select: [
        'id',
        'game_result_id',
        'memory_game_id',
        'correct_answer',
        'answer_play',
        'is_correct',
        'time_start_play_level',
        'memory_game',
      ],
      relations: ['memory_game'],
      where: { id },
    });
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
    id: number,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      time_start_play_level: new Date(Date.now()),
    });
  }

  async updateMemoryGameResultWithCorrectAnswer(
    id: number,
    correctAnswer: string,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      correct_answer: correctAnswer,
    });
  }

  async updateTimeStartGameResult(id: number, timeStart: Date) {
    return await this.gameResultRepository.update(id, {
      time_start: timeStart,
    });
  }
  async updateFinishGame(id: number) {
    return await this.gameResultRepository.update(id, {
      status: StatusGameResultEnum.FINISHED,
    });
  }

  async updateGameResultWithStatus(id: number, status: StatusGameResultEnum) {
    return await this.gameResultRepository.update(id, { status });
  }

  async updateGameResultWithPlayTime(id: number, playTime: number) {
    return await this.gameResultRepository.update(id, { play_time: playTime });
  }

  async updateGameResultPlayTimeAndScore(payload: {
    id: number;
    playTime: number;
    playScore: number;
  }) {
    return await this.gameResultRepository.update(
      { id: payload.id },
      {
        play_time: payload.playTime,
        play_score: payload.playScore,
      },
    );
  }

  async createMemoryGameResult(payload: createMemoryGameResultInterface) {
    return await this.memoryGameResultRepository.save(payload);
  }

  async update_answer_play_memory_game_result(
    id: number,
    answerPlay: string,
    isCorrect: boolean,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }
}
