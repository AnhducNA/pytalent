import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogicalGame } from '@entities/logicalGame.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Injectable()
export class GamePlayingService {
  constructor(
    @InjectRepository(LogicalGame)
    private readonly logicalGameRepository: Repository<LogicalGame>,
    @InjectRepository(MemoryGame)
    private readonly memoryGameRepository: Repository<MemoryGame>,
  ) {}
  async findLogicalGame(): Promise<LogicalGame[]> {
    return this.logicalGameRepository.find();
  }
  async findLogicalGameById(id: number): Promise<LogicalGame> {
    return this.logicalGameRepository.findOneBy({ id: id });
  }
}
