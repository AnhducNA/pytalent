import { Module } from '@nestjs/common';
import { GamePlayingController } from '@modules/game_playing/gamePlaying.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGame } from '@entities/memoryGame.entity';
import { GamePlayingService } from '@modules/game_playing/gamePlaying.service';

@Module({
  imports: [TypeOrmModule.forFeature([LogicalQuestion, MemoryGame])],
  controllers: [GamePlayingController],
  providers: [GamePlayingService],
  exports: [GamePlayingService],
})
export class GamePlayingModule {}
