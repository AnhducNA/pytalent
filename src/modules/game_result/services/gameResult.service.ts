import { Injectable } from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { LogicalGameResultRepository } from '../repositories/logicalGameResult.repository';
import { GameResultRepository } from '../repositories/gameResult.repository';
import { MemoryGameResultRepository } from '../repositories/memoryGameResult.repository';

@Injectable()
export class GameResultService {
  constructor(
    private gameResultRepository: GameResultRepository,
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
    switch (gameId) {
      case 1:
        const scoresOfCorrectAnswerInLogical: number[] =
          await this.logicalAnswerRepository.getScoresOfCorrectAnswer(
            gameResultId,
          );
        return scoresOfCorrectAnswerInLogical.reduce((acc, item) => {
          return acc + item;
        }, 0);
      case 2:
        const scoresOfCorrectAnswerInMemory: number[] =
          await this.memoryAnswerRepository.getScoresOfCorrectAnswer(
            gameResultId,
          );
        return scoresOfCorrectAnswerInMemory.reduce((acc, item) => {
          return acc + item;
        }, 0);
      default: {
        return 0;
      }
    }
  }

  async getGameResultDetailOfCandidate(
    candidateId: number,
    gameResultId: number,
  ) {
    const gameResult: {
      id: number;
      game_id: number;
      play_time: number;
      play_score: number;
      status: StatusGameResultEnum;
    } = await this.gameResultRepository.getInfoPlayed(
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
        return { gameResult, historyPlay: logicalAnswerHistory };
      case 2:
        const memoryAnswerHistory =
          await this.memoryAnswerRepository.getByGameResultAndCandidate(
            gameResultId,
            candidateId,
          );
        return { gameResult, historyPlay: memoryAnswerHistory };
    }
    return { gameResult, historyPlay: {} };
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
