import { Test, TestingModule } from '@nestjs/testing';
import { LogicalGameResultService } from './logicalGameResult.service';
import { GameResultService } from './gameResult.service';
import { GameService } from '@modules/game/game.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { GameResult } from '@entities/gameResult.entity';
import { BadRequestException } from '@nestjs/common';
import { StatusLogicalGameResultEnum } from '@common/enum/status-logical-game-result.enum';
import { IcreateLogicalGameResult } from '@shared/interfaces/logicalGameResult.interface';

describe('LogicalGameResultService', () => {
  let service: LogicalGameResultService;
  let gameResultService: GameResultService;
  let gameService: GameService;
  let logicalGameResultRepository: Repository<LogicalGameResult>;

  beforeEach(async () => {
    const mockGameResultService = {
      findAndValidateGameResult: jest.fn(),
      updateFinishGame: jest.fn(),
      updateGameResultPlayTimeAndScore: jest.fn(),
    };
    const mockGameService = {
      getTotalQuestionGameLogical: jest.fn(),
      getLogicalQuestionRender: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalGameResultService,
        {
          provide: GameResultService,
          useValue: mockGameResultService, // Mock GameResultService
        },
        {
          provide: GameService,
          useValue: mockGameService, // Mock GameService
        },
        {
          provide: getRepositoryToken(LogicalGameResult),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<LogicalGameResultService>(LogicalGameResultService);
    gameResultService = module.get<GameResultService>(GameResultService);
    gameService = module.get<GameService>(GameService);
    logicalGameResultRepository = module.get<Repository<LogicalGameResult>>(
      getRepositoryToken(LogicalGameResult),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findLogicalAnswerPlaceHold', () => {
    it('should throw BadRequestException if logicalGameResult is not found', async () => {
      jest.spyOn(service, 'findLogicalGameResult').mockResolvedValue(null);

      const result = service.findLogicalAnswerPlaceHold(190);
      await expect(result).rejects.toThrow(BadRequestException);
    });

    it('should return the logicalGameResult if found', async () => {
      const logicalAnswerId = 190;
      const mockLogicalGameResult = new LogicalGameResult();
      jest
        .spyOn(service, 'findLogicalGameResult')
        .mockResolvedValue(mockLogicalGameResult);

      const result = await service.findLogicalAnswerPlaceHold(logicalAnswerId);
      expect(result).toBe(mockLogicalGameResult);
    });
  });

  describe('validateLogicalQuestion', () => {
    it('should return status true if indexQuestion is less than or equal to total questions', async () => {
      const totalQuestion = 20;
      const indexQuestion = 15;

      jest
        .spyOn(gameService, 'getTotalQuestionGameLogical')
        .mockResolvedValue(totalQuestion);

      const result = await service.validateLogicalQuestion(indexQuestion);
      expect(result).toEqual({ status: true });
      expect(gameService.getTotalQuestionGameLogical).toHaveBeenCalled();
    });

    it('should return status false and a message if indexQuestion exceeds total questions', async () => {
      const totalQuestion = 5;
      const indexQuestion = 6;

      jest
        .spyOn(gameService, 'getTotalQuestionGameLogical')
        .mockResolvedValue(totalQuestion);

      const result = await service.validateLogicalQuestion(indexQuestion);
      expect(result).toEqual({
        status: false,
        message: 'You have completed the game. End game.',
      });
      expect(gameService.getTotalQuestionGameLogical).toHaveBeenCalled();
    });
  });

  describe('updateFinalQuestion', () => {
    it('should finish the game if the index is equal to total questions', async () => {
      const indexQuestion = 5;
      const gameResultId = 1;
      const totalQuestion = 5;

      jest
        .spyOn(gameService, 'getTotalQuestionGameLogical')
        .mockResolvedValue(totalQuestion);
      const spyUpdateFinishGame = jest
        .spyOn(gameResultService, 'updateFinishGame')
        .mockResolvedValue(null);

      const result = await service.updateFinalQuestion(
        indexQuestion,
        gameResultId,
      );
      expect(spyUpdateFinishGame).toHaveBeenCalledWith(gameResultId);
      expect(result).toEqual({ message: 'End Game' });
    });
  });

  describe('checkCorrectAnswer', () => {
    it('should return correct answer message and updated play score', async () => {
      const result = await service.checkCorrectAnswer(true, 15, true, 2);

      expect(result.isCorrect).toBe(true);
      expect(result.message).toBe('Your answer is true');
      expect(result.data.newPlayScore).toBe(17);
    });

    it('should return incorrect answer message and same play score', async () => {
      const result = await service.checkCorrectAnswer(false, 18, true, 1);
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe('Your answer is false');
      expect(result.data.newPlayScore).toBe(18);
    });
  });

  describe('getNextLogicalQuestion', () => {
    it('should return the next logical question', async () => {
      const indexQuestion = 3;
      const gameResultId = 72;
      const logicalGameResultHistory = [
        { logical_question_id: 1, logical_question: { correct_answer: true } },
      ];

      jest
        .spyOn(service, 'getHistoryAnswered')
        .mockResolvedValue(logicalGameResultHistory as any);
      jest.spyOn(gameService, 'getLogicalQuestionRender').mockResolvedValue({
        id: 2,
        statement1: 'S1',
        statement2: 'S2',
        conclusion: 'C',
        score: 10,
      } as any);
      jest
        .spyOn(service, 'createLogicalAnswer')
        .mockResolvedValue({ id: 2, index: 2 } as any);
      const result = await service.getNextLogicalQuestion(
        indexQuestion,
        gameResultId,
      );
      expect(result).toEqual({
        logicalQuestionRenderNext: {
          logicalGameResultId: 2,
          logicalQuestionId: 2,
          index: 2,
          statement1: 'S1',
          statement2: 'S2',
          conclusion: 'C',
          score: 10,
        },
      });
    });
  });

  describe('findLogicalGameResult', () => {
    it('should return a logical game result by id', async () => {
      const logicalGameResultId = 190;
      const mockResult = new LogicalGameResult();

      jest
        .spyOn(logicalGameResultRepository, 'findOne')
        .mockResolvedValue(mockResult as LogicalGameResult);

      const result = await service.findLogicalGameResult(logicalGameResultId);

      expect(logicalGameResultRepository.findOne).toHaveBeenCalledWith({
        where: { id: logicalGameResultId },
        relations: ['logical_question'],
      });
      expect(result).toEqual(mockResult);
    });

    it('should return null if no logical game result is found', async () => {
      const logicalGameResultId = 1900;

      jest
        .spyOn(logicalGameResultRepository, 'findOne')
        .mockResolvedValue(null);

      const result = await service.findLogicalGameResult(logicalGameResultId);

      expect(logicalGameResultRepository.findOne).toHaveBeenCalledWith({
        where: { id: logicalGameResultId },
        relations: ['logical_question'],
      });
      expect(result).toBeNull();
    });
  });
  describe('getHistoryAnswered', () => {
    it('should return an array of logical game results by gameResultId', async () => {
      const gameResultId = 1;
      const mockResults = [
        { id: 1, logical_question: {} },
        { id: 2, logical_question: {} },
      ];

      jest
        .spyOn(logicalGameResultRepository, 'find')
        .mockResolvedValue(mockResults as LogicalGameResult[]);

      const result = await service.getHistoryAnswered(gameResultId);

      expect(logicalGameResultRepository.find).toHaveBeenCalledWith({
        relations: ['logical_question'],
        where: { game_result_id: gameResultId },
      });
      expect(result).toEqual(mockResults);
    });

    it('should return an empty array if no logical game results are found', async () => {
      const gameResultId = 1;

      jest.spyOn(logicalGameResultRepository, 'find').mockResolvedValue([]);

      const result = await service.getHistoryAnswered(gameResultId);

      expect(logicalGameResultRepository.find).toHaveBeenCalledWith({
        relations: ['logical_question'],
        where: { game_result_id: gameResultId },
      });
      expect(result).toEqual([]);
    });
  });
  describe('updateLogicalAnswered', () => {
    it('should update logical answer with correct values', async () => {
      const id = 1;
      const answer_play = true;
      const is_correct = true;

      await service.updateLogicalAnswered(id, answer_play, is_correct);

      expect(
        logicalGameResultRepository
          .createQueryBuilder()
          .update(LogicalGameResult)
          .set({
            status: StatusLogicalGameResultEnum.ANSWERED,
            answer_play,
            is_correct,
          })
          .where('id = :id', { id: id })
          .execute(),
      );
    });
  });
  describe('createLogicalAnswer', () => {
    it('should create and return a new logical answer', async () => {
      const payload: IcreateLogicalGameResult = {
        index: 1,
        game_result_id: 1,
        logical_question_id: 1,
        status: StatusLogicalGameResultEnum.NO_ANSWER,
        answer_play: null,
        is_correct: null,
      };
      const savedLogicalAnswer = { id: 1, ...payload };
      jest
        .spyOn(logicalGameResultRepository, 'save')
        .mockResolvedValue(savedLogicalAnswer as LogicalGameResult);

      const result = await service.createLogicalAnswer(payload);

      expect(result).toBe(savedLogicalAnswer);
      expect(logicalGameResultRepository.save).toHaveBeenCalledWith(payload);
    });
  });
});
