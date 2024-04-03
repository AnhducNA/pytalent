import { Module } from '@nestjs/common';
import { GamePlayingController } from '@modules/game_playing/gamePlaying.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogicalGame } from '@entities/logicalGame.entity';
import { MemoryGame } from '@entities/memoryGame.entity';
import { GamePlayingService } from '@modules/game_playing/gamePlaying.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogicalGame, MemoryGame])],
  controllers: [GamePlayingController],
  providers: [GamePlayingService],
  exports: [GamePlayingService],
})
export class GamePlayingModule {}
