import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Injectable()
export class GamePlayingService {
  constructor(
    @InjectRepository(LogicalQuestion)
    private readonly logicalGameRepository: Repository<LogicalQuestion>,
    @InjectRepository(MemoryGame)
    private readonly memoryGameRepository: Repository<MemoryGame>,
  ) {}
  async findLogicalQuestion(): Promise<LogicalQuestion[]> {
    return this.logicalGameRepository.find();
  }
  async findLogicalQuestionById(id: number): Promise<LogicalQuestion> {
    return this.logicalGameRepository.findOneBy({ id: id });
  }
}
