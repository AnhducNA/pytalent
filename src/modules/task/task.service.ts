import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameResultService } from '@modules/game_result/services/gameResult.service';
import { GameResultRepository } from '@modules/game_result/repositories/gameResult.repository';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  // constructor(
  //   private readonly gameResultService: GameResultService,
  //   private gameResultRepository: GameResultRepository,
  // ) {}

  // @Cron('*/5 * * * * *')
  // async handleCron() {
  // await this.gameResultRepository.set_game_result_play_time_finish();
  // this.logger.debug('Called every 5 second');
  // }
  // @Interval(10000)
  // handleInterval() {
  //   this.logger.debug('Called every 10 seconds');
  // }
  //
  // @Timeout(5000)
  // handleTimeout() {
  //   this.logger.debug('Called once after 5 seconds');
  // }
}
