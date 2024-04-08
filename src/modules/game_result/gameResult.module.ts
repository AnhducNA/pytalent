import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameResultController } from '@modules/game_result/gameResult.controller';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameService } from '@modules/game/game.service';
import { Game } from '@entities/game.entity';
import { LogicalGame } from '@entities/logicalGame.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameResult,
      LogicalGameResult,
      Game,
      LogicalGame,
      MemoryGame,
    ]),
  ],
  controllers: [GameResultController],
  providers: [GameResultService, GameService],
  exports: [GameResultService],
})
export class GameResultModule {}
