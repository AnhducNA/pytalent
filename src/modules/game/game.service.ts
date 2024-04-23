import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from '@entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryGame } from '@entities/memoryGame.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(LogicalQuestion)
    private logicalQuestionRepository: Repository<LogicalQuestion>,
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
      // Don't have game in DB => create game
      game = await this.gameRepository.save(params);
    }
    return game;
  }

  async getLogicalQuestion() {
    return await this.logicalQuestionRepository.find();
  }

  async getMemoryGame() {
    return await this.memoryGameRepository.find();
  }

  async findLogicalGameById(id: number) {
    return await this.logicalQuestionRepository.findOneBy({ id });
  }

  async getLogicalGameRender(number: number) {
    return await this.logicalQuestionRepository
      .createQueryBuilder('logical_game')
      .orderBy('RAND()')
      .limit(number)
      .getMany();
  }

  async findMemoryGameById(id: number) {
    return await this.memoryGameRepository.findOneBy({ id });
  }

  async createLogicalGame(params: {
    statement1: string;
    statement2: string;
    conclusion: string;
    correct_answer: boolean;
    score: number;
  }) {
    return await this.logicalQuestionRepository.save(params);
  }

  async validateMemoryGame(paramsMemoryGame: {
    level: number;
    correct_answer: any;
    score: number;
  }) {
    if (
      paramsMemoryGame.correct_answer.length.toString() !==
      paramsMemoryGame.level.toString()
    ) {
      return {
        status: false,
        message: `Length of corrects answer must equal level`,
      };
    }
    const memoryGameData = await this.memoryGameRepository
      .createQueryBuilder()
      .where('level = :level', { level: paramsMemoryGame.level })
      .getOne();
    if (memoryGameData) {
      return {
        status: false,
        message: `memory_game already exits on the system with level ${paramsMemoryGame.level}`,
      };
    }
    return {
      status: true,
      message: 'success',
    };
  }

  async createMemoryGame(paramsMemoryGame: {
    level: number;
    correct_answer: any;
    score: number;
  }) {
    return await this.memoryGameRepository.save(paramsMemoryGame);
  }
}
