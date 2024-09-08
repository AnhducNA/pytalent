import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameResultController } from '@modules/game_result/controllers/gameResult.controller';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Game } from '@entities/game.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { MemoryData } from '@entities/memoryData.entity';
import { GameResultPlayingController } from '@modules/game_result/controllers/gameResult.playing.controller';
import { GameResultPlayingLogicalController } from '@modules/game_result/controllers/gameResult.playingLogical.controller';
import { GameResultPlayingMemoryController } from '@modules/game_result/controllers/gameResult.playingMemory.controller';
import { LogicalGameResultService } from './logicalGameResult.service';
import { GameModule } from '@modules/game/game.module';
import { AssessmentModule } from '@modules/assessment/assessment.module';
import { MemoryGameResultService } from './memoryGameResult.service';
import { GameResultRepository } from './repositories/gameResult.repository';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { AssessmentRepository } from '@modules/assessment/assessment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameResult,
      LogicalGameResult,
      MemoryGameResult,
      Game,
      LogicalQuestion,
      MemoryData,
    ]),
    GameModule,
    AssessmentModule,
  ],
  controllers: [
    GameResultController,
    GameResultPlayingController,
    GameResultPlayingMemoryController,
    GameResultPlayingLogicalController,
  ],
  providers: [
    GameService,
    GameResultService,
    LogicalGameResultService,
    MemoryGameResultService,
    GameResultRepository,
    AssessmentRepository,
    LogicalGameResultRepository,
  ],
  exports: [GameResultService],
})
export class GameResultModule {}
