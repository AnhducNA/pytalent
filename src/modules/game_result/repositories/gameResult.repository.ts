import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { createGameResultInterface } from '@shared/interfaces/gameResult.interface';

@Injectable()
export class GameResultRepository extends Repository<GameResult> {
  constructor(private dataSource: DataSource) {
    super(GameResult, dataSource.createEntityManager());
  }

  async createGameResult(payload: createGameResultInterface) {
    return await this.save(payload);
  }
  async findAndValidateGameResult(id: number): Promise<GameResult> {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: GameResult = await this.findOne({ where: { id } });
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
    const totalGameTime = await this.getTotalGameTime(gameResultId);
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      return false;
    }
    return true;
  }

  async getTotalGameTime(gameResultId: number): Promise<number> {
    const gameResult = await this.createQueryBuilder('game_result')
      .select('game_result.id', 'game_result_id')
      .addSelect(['game.total_time', 'game.total_question'])
      .innerJoin('game_result.game', 'game')
      .where('game_result.id = :id', { id: gameResultId })
      .getOne();
    return gameResult.game.total_time;
  }

  async updateFinishGame(id: number) {
    return await this.update(id, {
      status: StatusGameResultEnum.FINISHED,
    });
  }

  async updatePlayTimeAndScore(payload: {
    id: number;
    playTime: number;
    playScore: number;
  }) {
    return await this.update(
      { id: payload.id },
      {
        play_time: payload.playTime,
        play_score: payload.playScore,
      },
    );
  }
  async updateStatus(id: number, status: StatusGameResultEnum) {
    return await this.update(id, { status });
  }
  async getByCandidateAndGame(
    candidateId: number,
    assessmentId: number,
    gameId: number,
  ): Promise<GameResult> {
    const gameResult = await this.findOne({
      where: {
        candidate_id: candidateId,
        assessment_id: assessmentId,
        game_id: gameId,
      },
    });
    if (!gameResult) {
      throw new BadRequestException(
        'Game result with candidate and assessment does not exit',
      );
    }
    return gameResult;
  }
}
