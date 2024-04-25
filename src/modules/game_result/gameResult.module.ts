import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameResultController } from '@modules/game_result/gameResult.controller';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Game } from '@entities/game.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGame } from '@entities/memoryGame.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { MemoryData } from '@entities/memoryData.entity';
import { GameResultPlayingController } from '@modules/game_result/gameResult.playing.controller';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameResult,
      LogicalGameResult,
      MemoryGameResult,
      Game,
      LogicalQuestion,
      MemoryGame,
      MemoryData,
      AssessmentCandidate,
    ]),
  ],
  controllers: [GameResultController, GameResultPlayingController],
  providers: [GameResultService, GameService],
  exports: [GameResultService],
})
export class GameResultModule {}
