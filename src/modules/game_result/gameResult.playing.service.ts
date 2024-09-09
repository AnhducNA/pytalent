import { Injectable } from '@nestjs/common';
import { GameResultRepository } from './repositories/gameResult.repository';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { MemoryGameResultRepository } from './repositories/memoryGameResult.repository';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';

@Injectable()
export class GameResultPlayingService {
  constructor(
    private gameResultRepository: GameResultRepository,
    private logicalAnswerRepository: LogicalGameResultRepository,
    private memoryAnswerRepository: MemoryGameResultRepository,
  ) {}

  async pauseOrExitPlayGame(gameResultId: number) {
    const gameResult = await this.gameResultRepository.getOne(gameResultId);
    const playTime = Date.now() - gameResult.time_start.getTime();
    await this.gameResultRepository.updatePlayTimeAndStatus(
      gameResultId,
      playTime,
      StatusGameResultEnum.PAUSED,
    );
  }

  async endPlayGame(gameResultId: number) {
    await this.gameResultRepository.updateStatus(
      gameResultId,
      StatusGameResultEnum.PAUSED,
    );
  }
}
