import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { GameResult } from '@entities/gameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { createGameResultInterface } from '@interfaces/gameResult.interface';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';
import { MemoryGameResultService } from './memoryGameResult.service';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { GameResultRepository } from './repositories/gameResult.repository';
import { CreateGameResultDto } from './createGameResult.dto';
import { GameService } from '@modules/game/game.service';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { AssessmentRepository } from '@modules/assessment/assessment.repository';

@Injectable()
export class GameResultService {
  constructor(
    private gameResultRepository: GameResultRepository,
    @InjectRepository(MemoryGameResult)
    private memoryGameResultRepository: Repository<MemoryGameResult>,
    private logicalAnswerRepository: LogicalGameResultRepository,
    private memoryAnswerService: MemoryGameResultService,
    private gameService: GameService,
    private readonly assessmentRepository: AssessmentRepository,
  ) {}

  async findAll() {
    return await this.gameResultRepository.find();
  }

  async findOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async getOne(id: number): Promise<GameResult> {
    return await this.gameResultRepository.findOneBy({ id: id });
  }

  async delete(id: number) {
    return this.gameResultRepository.delete(id);
  }

  async findAndValidateGameResult(id: number): Promise<GameResult> {
    if (!id) {
      throw new BadRequestException('GameResult does not exit');
    }
    const gameResult: GameResult = await this.findOne(id);
    // validate check gameResult finished or paused
    if (gameResult.status === StatusGameResultEnum.FINISHED) {
      throw new BadRequestException('Game completed');
    }
    if (gameResult.status === StatusGameResultEnum.PAUSED) {
      throw new BadRequestException(
        'Game was paused. You need to continue to play',
      );
    }

    // validate check play_time > total_game_time
    const validatePlayTime: boolean = await this.validatePlayTime(
      id,
      gameResult.time_start,
    );

    if (!validatePlayTime) {
      throw new BadRequestException(`Game's time is over.`);
    }

    return gameResult;
  }

  async validatePlayTime(gameResultId: number, timeStart: Date) {
    const newPlayTime = Date.now() - timeStart.getTime();
    const totalGameTime = (await this.getGameInfoByGameResult(gameResultId))
      .game.total_time;
    if (newPlayTime > totalGameTime) {
      // when the game time is up, set done for game_result
      return false;
    }
    return true;
  }

  async getGameResultOfCandidate(candidateId: number) {
    const gameResultList = await this.gameResultRepository.find({
      where: { candidate_id: candidateId },
    });
    await Promise.all(
      gameResultList.map(async (gameResult) => {
        gameResult.play_score = await this.getTotalPlayScoreByGameResult(
          gameResult.id,
          gameResult.game_id,
        );
      }),
    );
    return gameResultList;
  }

  async deleteGameResultByAssessmentId(
    assessment_id: number,
  ): Promise<DeleteResult> {
    // delete assessment_candidate
    return await this.gameResultRepository
      .createQueryBuilder()
      .delete()
      .from(GameResult)
      .where(`assessment_id = ${assessment_id}`)
      .execute();
  }

  async get_game_result_exist_check(
    candidate_id: number,
    assessment_id: number,
    game_id: number,
  ) {
    return this.gameResultRepository
      .createQueryBuilder()
      .where(`candidate_id = ${candidate_id}`)
      .andWhere(`assessment_id = ${assessment_id}`)
      .andWhere(`game_id = ${game_id}`)
      .getOne();
  }

  async check_game_result_play_time_finish() {
    const game_result_playing_list = await this.gameResultRepository
      .createQueryBuilder('game_result')
      .select([
        'game_result.id',
        'game_result.time_start',
        'game_result.game_id',
      ])
      .addSelect('game.total_time')
      .innerJoin('game_result.game', 'game')
      .where('game_result.status IN (:...status_list)', {
        status_list: [
          StatusGameResultEnum.STARTED,
          StatusGameResultEnum.PAUSED,
        ],
      })
      .getMany();
    game_result_playing_list.map(async (game_result_playing) => {
      switch (game_result_playing.game_id) {
        case 1:
          if (
            Date.now() - game_result_playing.time_start.getTime() >
            game_result_playing.game.total_time
          ) {
            await this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
        case 2:
          if (Date.now() - game_result_playing.time_start.getTime() > 100000) {
            await this.updateGameResultWithStatus(
              game_result_playing.id,
              StatusGameResultEnum.FINISHED,
            );
          }
          break;
      }
    });
  }

  async getTotalPlayScoreByGameResult(gameResultId: number, gameId: number) {
    let totalPlayScore = 0;
    switch (gameId) {
      case 1:
        const logicalAnswerList =
          await this.logicalAnswerRepository.getLogicalAnswerCorrectByGameResult(
            gameResultId,
          );
        logicalAnswerList.map((item) => {
          totalPlayScore += item.logical_question.score;
        });
        return totalPlayScore;
        break;
      case 2:
        const memoryAnswerList =
          await this.memoryAnswerService.getAnswerCorrectByGameResult(
            gameResultId,
          );
        memoryAnswerList.map((item) => {
          totalPlayScore += item.memory_game.score;
        });
        return totalPlayScore;
        break;
      default: {
        return totalPlayScore;
        break;
      }
    }
  }

  async get_history_type_game_result_by_game_result(id: number) {
    return this.gameResultRepository.find({
      relations: ['logical_game_result_list', 'memory_game_result_list'],
      where: { id },
    });
  }

  async getGameResultByCandidateId(candidateId: number) {
    return this.gameResultRepository.find({
      where: { candidate_id: candidateId },
    });
  }

  async getGameInfoByGameResult(game_result_id: number) {
    return this.gameResultRepository
      .createQueryBuilder('game_result')
      .select('game_result.id', 'game_result_id')
      .addSelect(['game.total_time', 'game.total_question'])
      .innerJoin('game_result.game', 'game')
      .where('game_result.id = :id', { id: game_result_id })
      .getOne();
  }

  async get_memory_game_result_by_game_result_id(gameResulttId: number) {
    return await this.memoryGameResultRepository.find({
      select: [
        'id',
        'memory_game_id',
        'correct_answer',
        'answer_play',
        'is_correct',
      ],
      where: { game_result_id: gameResulttId },
    });
  }

  async get_memory_game_result_final_by_game_result(game_result_id: number) {
    return this.memoryGameResultRepository
      .createQueryBuilder('memory_game_result')
      .select([
        'memory_game_result.id',
        'memory_game_result.memory_game_id',
        'memory_game_result.correct_answer',
        'memory_game_result.answer_play',
        'memory_game_result.is_correct',
      ])
      .addSelect([
        'memory_game.level',
        'memory_game.score',
        'memory_game.time_limit',
      ])
      .innerJoin('memory_game_result.memory_game', 'memory_game')
      .where(`memory_game_result.game_result_id = ${game_result_id}`)
      .orderBy('memory_game_result.id', 'DESC')
      .getOne();
  }

  async update_memory_game_result_time_start_play_level_final_by_id(
    id: number,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      time_start_play_level: new Date(Date.now()),
    });
  }

  async updateMemoryGameResultWithCorrectAnswer(
    id: number,
    correctAnswer: string,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      correct_answer: correctAnswer,
    });
  }

  async updateTimeStartGameResult(id: number, timeStart: Date) {
    return await this.gameResultRepository.update(id, {
      time_start: timeStart,
    });
  }
  async updateFinishGame(id: number) {
    return await this.gameResultRepository.update(id, {
      status: StatusGameResultEnum.FINISHED,
    });
  }

  async updateGameResultWithStatus(id: number, status: StatusGameResultEnum) {
    return await this.gameResultRepository.update(id, { status });
  }

  async updateGameResultWithPlayTime(id: number, playTime: number) {
    return await this.gameResultRepository.update(id, { play_time: playTime });
  }

  async updateGameResultPlayTimeAndScore(payload: {
    id: number;
    playTime: number;
    playScore: number;
  }) {
    return await this.gameResultRepository.update(
      { id: payload.id },
      {
        play_time: payload.playTime,
        play_score: payload.playScore,
      },
    );
  }

  async update_answer_play_memory_game_result(
    id: number,
    answerPlay: string,
    isCorrect: boolean,
  ) {
    return await this.memoryGameResultRepository.update(id, {
      answer_play: answerPlay,
      is_correct: isCorrect,
    });
  }

  async handleGameStatus(gameResult: GameResult) {
    // Nếu có game_result => Kết thúc/ Tiếp tục.
    // Nếu không có game_result => Tạo mới trò chơi.
    switch (gameResult.status) {
      case StatusGameResultEnum.FINISHED:
        return {
          status: true,
          message: 'Game completed.',
        };
      case StatusGameResultEnum.STARTED:
      case StatusGameResultEnum.PAUSED:
        // continue play game_result
        return await this.continuePlayGame(gameResult);
      default:
        //   New game_result: Start play game: create new game_result
        return await this.startNewGame(
          gameResult.candidate_id,
          gameResult.assessment_id,
          gameResult.game_id,
        );
        break;
    }
  }

  async continuePlayGame(gameResult: GameResult) {
    const timeStart = new Date(Date.now() - gameResult.play_time);
    await this.updateTimeStartGameResult(gameResult.id, timeStart);
    gameResult.status = StatusGameResultEnum.STARTED;
    await this.gameResultRepository.updateStatus(
      gameResult.id,
      StatusGameResultEnum.STARTED,
    );
    switch (gameResult.game_id) {
      case 1:
        // Candidate continue play logicalQuestion
        return await this.continueLogicalGame(gameResult.id);
        break;
      case 2:
        // Candidate continue play memoryGame
        return await this.continueMemoryGame(gameResult.id);
        break;
      default:
        // validate check if game_id does not setting.
        return {
          status: true,
          message: `Game with id = ${gameResult.game_id} does not setting.`,
        };
        break;
    }
  }

  async continueLogicalGame(gameResultId: number) {
    const logicalAnswerFinal =
      await this.logicalAnswerRepository.getLogicalAnswerFinalByGameResult(
        gameResultId,
      );
    return {
      status: true,
      data: {
        logical_question_render_current: {
          logical_game_result_id: logicalAnswerFinal.id,
          logical_question_id: logicalAnswerFinal.logical_question_id,
          index: logicalAnswerFinal.index,
          statement1: logicalAnswerFinal.logical_question.statement1,
          statement2: logicalAnswerFinal.logical_question.statement2,
          conclusion: logicalAnswerFinal.logical_question.conclusion,
          score: logicalAnswerFinal.logical_question.score,
        },
      },
    };
  }

  async continueMemoryGame(gameResultId: number) {
    const memory_game_result_final =
      await this.get_memory_game_result_final_by_game_result(gameResultId);
    let correct_answer = [];
    for (let i = 1; i <= memory_game_result_final.memory_game.level; i++) {
      correct_answer = [
        ...correct_answer,
        ['left', 'right'][Math.floor(Math.random() * ['left', 'right'].length)],
      ];
    }
    await this.updateMemoryGameResultWithCorrectAnswer(
      memory_game_result_final.id,
      JSON.stringify(correct_answer),
    );
    await this.update_memory_game_result_time_start_play_level_final_by_id(
      memory_game_result_final.id,
    );
    return {
      message: 'Continue play game memory success.',
      data: {
        memory_game_render_current: {
          game_result_id: memory_game_result_final.game_result_id,
          memory_game_result_id: memory_game_result_final.id,
          memory_game_id: memory_game_result_final.memory_game_id,
          level: memory_game_result_final.memory_game.level,
          score: memory_game_result_final.memory_game.score,
          time_render: memory_game_result_final.memory_game.time_limit,
          correct_answer: correct_answer,
        },
      },
    };
  }

  // Start a new game
  async startNewGame(
    candidateId: number,
    assessmentId: number,
    gameId: number,
  ) {
    // Default value game_result before add new
    const newGameResult = await this.gameResultRepository.createGameResult({
      candidate_id: candidateId,
      assessment_id: assessmentId,
      game_id: gameId,
      play_time: 0,
      play_score: 0,
      status: StatusGameResultEnum.STARTED,
      time_start: new Date(Date.now()),
    });
    // Get Data game
    switch (gameId) {
      case 1:
        // Candidate start play logicalQuestion
        return await this.startLogicalGame(newGameResult.id);
      case 2:
        // Candidate start play memoryGame
        return await this.startMemoryGame(newGameResult.id);
      default:
        // whene game does not setting.
        return {
          status: false,
          message: `Game with id = ${gameId} does not setting.`,
        };
    }
  }

  async startLogicalGame(gameResultId: number) {
    const logical_question_render_next =
      await this.gameService.getLogicalQuestionRender([], []);
    // create logical_game_result
    const logical_game_result_new =
      await this.logicalAnswerRepository.createLogicalAnswer({
        index: 1,
        game_result_id: gameResultId,
        logical_question_id: logical_question_render_next.id,
        status: StatusLogicalGameResultEnum.NO_ANSWER,
        answer_play: null,
        is_correct: null,
      });

    return {
      message: 'Start play game logical success.',
      data: {
        logical_question_render_next: {
          logical_game_result_id: logical_game_result_new.id,
          logical_question_id: logical_question_render_next.id,
          index: 1,
          statement1: logical_question_render_next.statement1,
          statement2: logical_question_render_next.statement2,
          conclusion: logical_question_render_next.conclusion,
          score: logical_question_render_next.score,
        },
      },
    };
  }

  async startMemoryGame(gameResultId: number) {
    const correct_answer = [
      ['left', 'right'][Math.floor(Math.random() * ['left', 'right'].length)],
    ];
    await this.memoryAnswerService.create({
      game_result_id: gameResultId,
      memory_game_id: (await this.gameService.getMemoryDataByLevel(1)).id,
      correct_answer: JSON.stringify(correct_answer),
      answer_play: null,
      is_correct: null,
      time_start_play_level: new Date(Date.now()),
    });
    const memoryAnswerFinalByGameResult =
      await this.get_memory_game_result_final_by_game_result(gameResultId);
    return {
      message: 'Start play game memory success.',
      data: {
        memory_data_render_next: {
          game_result_id: memoryAnswerFinalByGameResult.game_result_id,
          memory_game_result_id: memoryAnswerFinalByGameResult.id,
          memory_game_id: memoryAnswerFinalByGameResult.memory_game_id,
          level: memoryAnswerFinalByGameResult.memory_game.level,
          score: memoryAnswerFinalByGameResult.memory_game.score,
          time_render: memoryAnswerFinalByGameResult.memory_game.time_limit,
          correct_answer: JSON.parse(
            memoryAnswerFinalByGameResult.correct_answer,
          ),
          time_start_play_level:
            memoryAnswerFinalByGameResult.time_start_play_level,
        },
      },
    };
  }

  async startPlayGame(userId: number, gameResultParams: CreateGameResultDto) {
    await this.validateStartPlayGame(gameResultParams.assessment_id, userId);

    // check start/ continue/ end of game_result
    const gameResult = await this.gameResultRepository.getByCandidateAndGame(
      userId,
      gameResultParams.assessment_id,
      gameResultParams.game_id,
    );
    return await this.handleGameStatus(gameResult);
  }

  async validateStartPlayGame(assessmentId: number, candidateId: number) {
    // validate check assessment time_end
    const timeEndOfAssessment = await this.assessmentRepository.getTimeEnd(
      assessmentId,
    );
    if (timeEndOfAssessment.getTime() - Date.now() < 0) {
      return {
        status: false,
        message: `Assessment has expired. Time end: ${timeEndOfAssessment}.`,
      };
    }
    // validate check assessment contain Candidate?
    const assessmentCheckCandidate =
      await this.assessmentRepository.getOnetWithCandidate(
        assessmentId,
        candidateId,
      );

    if (!assessmentCheckCandidate) {
      return {
        status: false,
        message: 'Assessment does not have candidate .',
      };
    }
  }
}
