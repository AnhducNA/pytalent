import { Injectable } from '@nestjs/common';
import { GameResultRepository } from '../repositories/gameResult.repository';
import { LogicalGameResultRepository } from '../repositories/logicalGameResult.repository';
import { MemoryGameResultRepository } from '../repositories/memoryGameResult.repository';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { CreateGameResultDto } from '../createGameResult.dto';
import { AssessmentRepository } from '@modules/assessment/assessment.repository';
import { GameResult } from '@entities/gameResult.entity';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { GameService } from '@modules/game/game.service';

@Injectable()
export class GameResultPlayingService {
  constructor(
    private gameResultRepository: GameResultRepository,
    private logicalAnswerRepository: LogicalGameResultRepository,
    private memoryAnswerRepository: MemoryGameResultRepository,
    private assessmentRepository: AssessmentRepository,
    private gameService: GameService,
  ) {}

  async pauseOrExitPlayGame(gameResultId: number) {
    const gameResult = await this.gameResultRepository.getOne(gameResultId);
    const playTime = Date.now() - gameResult.time_start.getTime();
    await this.gameResultRepository.updatePlayTimeAndStatus(
      gameResultId,
      playTime,
      StatusGameResultEnum.PAUSED,
    );
  }

  async endPlayGame(gameResultId: number) {
    await this.gameResultRepository.updateStatus(
      gameResultId,
      StatusGameResultEnum.PAUSED,
    );
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

  async handleGameStatus(gameResult: GameResult) {
    // Nếu có game_result => Kết thúc/ Tiếp tục.
    // Nếu không có game_result => Tạo mới trò chơi.
    switch (gameResult.status) {
      case StatusGameResultEnum.FINISHED:
        return {
          status: true,
          message: 'Game completed.',
          data: gameResult,
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
    }
  }

  async continuePlayGame(gameResult: GameResult) {
    const timeStart = new Date(Date.now() - gameResult.play_time);
    await this.gameResultRepository.updateTimeStart(gameResult.id, timeStart);
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
      default:
        // validate check if game_id does not setting.
        return {
          status: true,
          message: `Game with id = ${gameResult.game_id} does not setting.`,
        };
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
      await this.memoryAnswerRepository.getFinalByGameResult(gameResultId);
    let correct_answer = [];
    for (let i = 1; i <= memory_game_result_final.memory_game.level; i++) {
      correct_answer = [
        ...correct_answer,
        ['left', 'right'][Math.floor(Math.random() * ['left', 'right'].length)],
      ];
    }
    await this.memoryAnswerRepository.updateCorrectAnswer(
      memory_game_result_final.id,
      JSON.stringify(correct_answer),
    );
    await this.memoryAnswerRepository.updateTimeStartPlayLevel(
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
    await this.memoryAnswerRepository.insertData({
      gameResultId,
      memoryGameId: (await this.gameService.getMemoryDataByLevel(1)).id,
      correctAnswer: JSON.stringify(correct_answer),
    });
    const memoryAnswerFinalByGameResult =
      await this.memoryAnswerRepository.getFinalByGameResult(gameResultId);
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
}
