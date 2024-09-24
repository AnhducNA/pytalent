import { BadRequestException, Injectable } from '@nestjs/common';
import { createMemoryGameResultInterface } from '@shared/interfaces/memoryGameResult.interface';
import { MemoryGameResultRepository } from '../repositories/memoryGameResult.repository';
import { GameResultRepository } from '../repositories/gameResult.repository';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { arraysEqualWithoutLength } from '@helper/function';

@Injectable()
export class MemoryGameResultService {
  constructor(
    private memoryAnswerRepository: MemoryGameResultRepository,
    private gameResultRepository: GameResultRepository,
  ) {}

  async getOneMemoryAnswer(id: number): Promise<MemoryGameResult> {
    return await this.memoryAnswerRepository.findOne({
      relations: ['memory_game'],
      where: { id },
    });
  }

  async create(payload: createMemoryGameResultInterface) {
    return await this.memoryAnswerRepository.save(payload);
  }

  async updateAnswerPlay(id: number, answerPlay: string, isCorrect: boolean) {
    return await this.memoryAnswerRepository.update(id, {
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }

  async calculatePlayingMemory(memoryAnswerId: number, answerPlay: string[]) {
    const memoryAnswerPlaceHold = await this.memoryAnswerRepository.getOne(
      memoryAnswerId,
    );
    const gameResult = await this.gameResultRepository.getOne(
      memoryAnswerPlaceHold.game_result_id,
    );

    await this.validatePlayingMemory(
      {
        id: memoryAnswerId,
        answerPlay: memoryAnswerPlaceHold.answer_play,
        timeStartPlayLevel: memoryAnswerPlaceHold.time_start_play_level,
        timeLimit: memoryAnswerPlaceHold.memory_game.time_limit,
      },
      { id: gameResult.id, status: gameResult.status },
    );

    // Check answer_play is true or false?
    const dataUpdate = { message: '', playScore: 0 };
    if (
      arraysEqualWithoutLength(
        answerPlay,
        JSON.parse(memoryAnswerPlaceHold.correct_answer),
      ) === true
    ) {
      dataUpdate.message = 'Your answer is true.';
      dataUpdate.playScore += memoryAnswerPlaceHold.memory_game.score;
    } else {
      dataUpdate.message = 'Your answer is false. End game';
      await this.gameResultRepository.updateStatus(
        gameResult.id,
        StatusGameResultEnum.FINISHED,
      );
    }
    // End check done
    // update GameResult
    await this.gameResultRepository.updatePlayTimeAndScore({
      id: gameResult.id,
      playTime: Date.now() - gameResult.time_start.getTime(),
      playScore: dataUpdate.playScore,
    });
    // update memoryGameResult
    await this.memoryAnswerRepository.updateAnswerPlay(
      memoryAnswerId,
      JSON.stringify(answerPlay),
      memoryAnswerPlaceHold.is_correct,
    );
    return;
  }

  async validatePlayingMemory(
    memoryAnswer: {
      id: number;
      answerPlay: string;
      timeStartPlayLevel: Date;
      timeLimit: number;
    },
    gameResult: { id: number; status: StatusGameResultEnum },
  ) {
    // validate check memory_game_result_playing answered
    if (
      memoryAnswer.answerPlay &&
      JSON.parse(memoryAnswer.answerPlay).length > 0
    ) {
      throw new BadRequestException(
        `memory answer with id = ${memoryAnswer.id} answered.`,
      );
    }
    // validate check game_result status
    if (gameResult.status === StatusGameResultEnum.FINISHED) {
      return {
        message: 'Game over.',
      };
    }
    if (gameResult.status === StatusGameResultEnum.PAUSED) {
      return {
        message: 'Game was paused. You need to continue to play',
      };
    }

    // validate check play_time > time_limit_render's level
    const play_time = Date.now() - memoryAnswer.timeStartPlayLevel.getTime();
    if (play_time > memoryAnswer.timeLimit) {
      await this.gameResultRepository.updateStatus(
        gameResult.id,
        StatusGameResultEnum.FINISHED,
      );
      return {
        message: `Time play expired. End game.`,
      };
    }
  }
}
