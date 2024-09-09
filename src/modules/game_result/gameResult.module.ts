import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from '@modules/game_result/services/gameResult.service';
import { GameResultController } from '@modules/game_result/controllers/gameResult.controller';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Game } from '@entities/game.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { MemoryData } from '@entities/memoryData.entity';
import { GameResultPlayingController } from '@modules/game_result/controllers/gameResult.playing.controller';
import { GameResultPlayingMemoryController } from '@modules/game_result/controllers/gameResult.playingMemory.controller';
import { LogicalGameResultService } from './services/logicalGameResult.service';
import { GameModule } from '@modules/game/game.module';
import { AssessmentModule } from '@modules/assessment/assessment.module';
import { MemoryGameResultService } from './services/memoryGameResult.service';
import { GameResultRepository } from './repositories/gameResult.repository';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { AssessmentRepository } from '@modules/assessment/assessment.repository';
import { MemoryGameResultRepository } from './repositories/memoryGameResult.repository';
import { GameResultPlayingService } from './services/gameResult.playing.service';

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
  ],
  providers: [
    GameService,
    GameResultService,
    LogicalGameResultService,
    MemoryGameResultService,
    GameResultPlayingService,
    AssessmentRepository,
    GameResultRepository,
    LogicalGameResultRepository,
    MemoryGameResultRepository,
  ],
  exports: [GameResultService],
})
export class GameResultModule {}
