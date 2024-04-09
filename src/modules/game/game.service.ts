import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from '@entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogicalGame } from '@entities/logicalGame.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(LogicalGame)
    private logicalGameRepository: Repository<LogicalGame>,
    @InjectRepository(MemoryGame)
    private memoryGameRepository: Repository<MemoryGame>,
  ) {}

  async findAll() {
    return await this.gameRepository.find();
  }

  async findOne(id: number): Promise<any> {
    const game = await this.gameRepository.findOneBy({ id });
    return game;
  }

  async checkOrCreateGame(params: any) {
    let game = await this.gameRepository.findOne({
      where: {
        game_type: params.game_type,
      },
    });
    if (!game) {
      // Don't have user in DB => create game
      game = await this.gameRepository.save(params);
    }
    return game;
  }

  async findLogicalGameById(id: number) {
    return await this.logicalGameRepository.findOneBy({ id });
  }

  async findMemoryGameById(id: number) {
    return await this.memoryGameRepository.findOneBy({ id });
  }

  async createLogicalGame(params: {
    question: string;
    answer: string;
    correct_answer: string;
    score: number;
  }) {
    return await this.logicalGameRepository.save(params);
  }

  async createMemoryGame(params: {
    level: number;
    correct_answer: string;
    score: number;
  }) {
    return await this.memoryGameRepository.save(params);
  }
}
