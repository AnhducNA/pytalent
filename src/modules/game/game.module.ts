import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '@entities/game.entity';
import { GameService } from '@modules/game/game.service';
import { GameController } from '@modules/game/game.controller';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGame } from '@entities/memoryGame.entity';
import { GameLogicalController } from '@modules/game/game.logical.controller';
import { GameMemoryController } from '@modules/game/game.memory.controller';
import { MemoryData } from '@entities/memoryData.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, LogicalQuestion, MemoryGame, MemoryData])],
  controllers: [GameController, GameLogicalController, GameMemoryController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
