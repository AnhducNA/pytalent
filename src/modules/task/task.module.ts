import { Module } from '@nestjs/common';
import { TaskService } from '@modules/task/task.service';
import { GameResultModule } from '@modules/game_result/gameResult.module';

@Module({
  imports: [GameResultModule],
  providers: [TaskService],
})
export class TaskModule {}
