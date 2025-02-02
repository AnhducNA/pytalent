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

  async getOne(id: number) {
    const gameResult = await this.findOneBy({ id });
    if (!gameResult) {
      throw new BadRequestException('Game Result does not exit');
    }
    return gameResult;
  }

  async getInfoPlayed(id: number, candidateId: number) {
    const data: {
      id: number;
      game_id: number;
      play_time: number;
      play_score: number;
      status: StatusGameResultEnum;
    } = await this.findOne({
      select: ['id', 'game_id', 'play_time', 'play_score', 'status'],
      where: { id, candidate_id: candidateId },
    });
    if (!data) {
      throw new BadRequestException('You cannot view this gameResult.');
    }
    return data;
  }

  async createGameResult(payload: createGameResultInterface) {
    return await this.save(payload);
  }

  async validateGameResult(id: number) {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: {
      game_id: number;
      status: StatusGameResultEnum;
      time_start: Date;
    } = await this.findOne({
      select: ['game_id', 'time_start', 'status'],
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
      gameResult.game_id,
    );
    if (!validatePlayTime) {
      throw new BadRequestException(`Game's time is over.`);
    }
  }

  async validatePlayTime(
    gameResultId: number,
    timeStart: Date,
    gameId: number,
  ) {
    if (gameId === 1) {
      return false;
    }
    const newPlayTime = Date.now() - timeStart.getTime();
    const totalGameTime = await this.getTotalGameTime(gameResultId);
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      return false;
    }
    return true;
  }

  async getTotalGameTime(id: number): Promise<number> {
    const gameResult = await this.createQueryBuilder('game_result')
      .select('game_result.id', 'game_result_id')
      .addSelect(['game.total_time', 'game.total_question'])
      .innerJoin('game_result.game', 'game')
      .where('game_result.id = :id', { id })
      .getOne();
    return gameResult.game.total_time;
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

  async updateFinishGame(id: number) {
    return await this.update(id, {
      status: StatusGameResultEnum.FINISHED,
    });
  }

  async updatePlayTime(id: number, playTime: number) {
    return await this.update(id, { play_time: playTime });
  }

  async updateStatus(id: number, status: StatusGameResultEnum) {
    return await this.update(id, { status });
  }

  async updatePlayTimeAndStatus(
    id: number,
    playTime: number,
    status: StatusGameResultEnum,
  ) {
    await this.update(id, { play_time: playTime, status });
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

  async updateTimeStart(id: number, timeStart: Date) {
    return await this.update(id, {
      time_start: timeStart,
    });
  }
}
