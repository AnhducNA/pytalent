import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from '@entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryData } from '@entities/memoryData.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(LogicalQuestion)
    private logicalQuestionRepository: Repository<LogicalQuestion>,
    @InjectRepository(MemoryData)
    private memoryDataRepository: Repository<MemoryData>,
  ) {}

  async findAll() {
    return await this.gameRepository.find();
  }

  async findOne(id: number): Promise<any> {
    return await this.gameRepository.findOneBy({ id });
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
    return await this.memoryDataRepository.find();
  }
  async getTotalQuestionGameLogical() {
    const gameLogical = await this.gameRepository.findOne({
      select: ['total_question'],
      where: { id: 1 },
    });
    return parseInt(gameLogical.total_question);
  }
  async getLogicalQuestionRender(id_except: any[], check_identical: any[]) {
    // const id_except = [
    //   1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    // ];
    const is_consecutive_identical = !!(
      check_identical &&
      check_identical.length > 3 &&
      check_identical[check_identical.length - 1] ===
        check_identical[check_identical.length - 2] &&
      check_identical[check_identical.length - 2] ===
        check_identical[check_identical.length - 3]
    );
    //  Check số câu loại trừ.
    if (id_except && id_except.length > 0) {
      // Kiểm tra 3 câu liên tiếp trùng nhau
      if (
        !check_identical ||
        check_identical.length <= 3 ||
        is_consecutive_identical === false
      ) {
        return await this.logicalQuestionRepository
          .createQueryBuilder('logical_question')
          .select('logical_question.id')
          .addSelect('logical_question.statement1')
          .addSelect('logical_question.statement2')
          .addSelect('logical_question.conclusion')
          .addSelect('logical_question.score')
          .addSelect('logical_question.correct_answer')
          .where(`id NOT IN (${id_except.toString()})`)
          .orderBy('RAND()')
          .limit(1)
          .getOne();
      } else {
        // 3 consecutive identical
        return await this.logicalQuestionRepository
          .createQueryBuilder('logical_question')
          .select('logical_question.id')
          .addSelect('logical_question.statement1')
          .addSelect('logical_question.statement2')
          .addSelect('logical_question.conclusion')
          .addSelect('logical_question.score')
          .addSelect('logical_question.correct_answer')
          .where(`id NOT IN (${id_except.toString()})`)
          .andWhere(
            `correct_answer <> ${check_identical[check_identical.length - 1]}`,
          )
          .orderBy('RAND()')
          .limit(1)
          .getOne();
      }
    } else {
      // get the first logical question
      return await this.logicalQuestionRepository
        .createQueryBuilder('logical_question')
        .select('logical_question.id')
        .addSelect('logical_question.statement1')
        .addSelect('logical_question.statement2')
        .addSelect('logical_question.conclusion')
        .addSelect('logical_question.score')
        .addSelect('logical_question.correct_answer')
        .orderBy('RAND()')
        .limit(1)
        .getOne();
    }
  }

  async getMemoryDataByLevel(level: number) {
    return await this.memoryDataRepository
      .createQueryBuilder('memory_data')
      .select('memory_data.id')
      .addSelect('memory_data.level')
      .addSelect('memory_data.time_limit')
      .addSelect('memory_data.score')
      .where('level = :level', { level: level })
      .getOne();
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
    const memoryGameData = await this.memoryDataRepository
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
    return await this.memoryDataRepository.save(paramsMemoryGame);
  }
}
