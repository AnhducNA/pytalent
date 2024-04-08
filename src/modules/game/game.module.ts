import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from '@entities/game.entity';
import { GameService } from '@modules/game/game.service';
import { GameController } from '@modules/game/game.controller';
import { LogicalGame } from '@entities/logicalGame.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, LogicalGame, MemoryGame])],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
