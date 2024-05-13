import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameResultService } from '@modules/game_result/gameResult.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly gameResultService: GameResultService) {}

  @Cron('*/5 * * * * *')
  async handleCron() {
    const game_result_list =
      await this.gameResultService.check_game_result_play_time_finish();
    this.logger.debug('Called every 5 second');
  }
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
