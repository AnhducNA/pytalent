import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { LogicalGameResultRepository } from '../repositories/logicalGameResult.repository';
import { GameResultRepository } from '../repositories/gameResult.repository';
import { MemoryGameResultRepository } from '../repositories/memoryGameResult.repository';

@Injectable()
export class GameResultService {
  constructor(
    private gameResultRepository: GameResultRepository,
    @InjectRepository(MemoryGameResult)
    private logicalAnswerRepository: LogicalGameResultRepository,
    private memoryAnswerRepository: MemoryGameResultRepository,
  ) {}

  async getAll() {
    return await this.gameResultRepository.find();
  }

  async getOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.getOne(id);
  }

  async delete(id: number) {
    return this.gameResultRepository.delete(id);
  }

  async findAndValidateGameResult(id: number): Promise<GameResult> {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: GameResult = await this.getOne(id);
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

  async getListGameResultOfCandidate(candidateId: number) {
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
      case 2:
        const memoryAnswerList =
          await this.memoryAnswerRepository.getAnswerCorrectByGameResult(
            gameResultId,
          );
        memoryAnswerList.map((item) => {
          totalPlayScore += item.memory_game.score;
        });
        return totalPlayScore;
      default: {
        return totalPlayScore;
      }
    }
  }

  async getGameResultDetailOfCandidate(
    candidateId: number,
    gameResultId: number,
  ) {
    const gameResult = await this.gameResultRepository.getOneByCandidate(
      gameResultId,
      candidateId,
    );
    switch (gameResult.game_id) {
      case 1:
        const logicalAnswerHistory =
          await this.logicalAnswerRepository.getByGameResultAndCandidate(
            gameResultId,
            candidateId,
          );
        return { gameResult, logicalAnswerHistory };
      case 2:
        const memoryAnswerHistory =
          await this.memoryAnswerRepository.getByGameResultAndCandidate(
            gameResultId,
            candidateId,
          );
        return { gameResult, memoryAnswerHistory };
    }
    return { candidateId, gameResultId };
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
  async getDetailHistory(id: number) {
    return this.gameResultRepository.find({
      relations: ['logical_game_result_list', 'memory_game_result_list'],
      where: { id },
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

  async get_memory_game_result_by_game_result_id(gameResulttId: number) {
    return await this.memoryAnswerRepository.getByGameResult(gameResulttId);
  }

  async getFinalMemoryAnswer(gameResultId: number) {
    return await this.memoryAnswerRepository.getFinalByGameResult(gameResultId);
  }

  async updateGameResultWithStatus(id: number, status: StatusGameResultEnum) {
    return await this.gameResultRepository.update(id, { status });
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
}
