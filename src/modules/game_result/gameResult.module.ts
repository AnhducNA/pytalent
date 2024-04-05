import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameResultController } from '@modules/game_result/gameResult.controller';
import { LogicalGameResult } from '@entities/LogicalGameResult.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameResult, LogicalGameResult])],
  controllers: [GameResultController],
  providers: [GameResultService],
  exports: [GameResultService],
})
export class GameResultModule {}
