import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '@modules/game/game.service';
import { GameResultService } from './gameResult.service';
import { LogicalGameResultService } from './logicalGameResult.service';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { BadRequestException } from '@nestjs/common';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { GameResult } from '@entities/gameResult.entity';

describe('LogicalGameResultService', () => {
  let service: LogicalGameResultService;
  let gameResultService: GameResultService;
  let gameService: GameService;
  let logicalGameResultRepository: Repository<LogicalGameResult>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalGameResultService,
        {
          provide: getRepositoryToken(LogicalGameResult),
          useClass: Repository,
        },
        {
          provide: GameResultService,
          useValue: {
            findOne: jest.fn(),
            updateFinishGame: jest.fn(),
            updateGameResultPlayTimeAndScore: jest.fn(),
            updateLogicalAnswered: jest.fn(),
            getGameInfoByGameResult: jest.fn(),
            createLogicalGameResult: jest.fn(),
          },
        },
        {
          provide: GameService,
          useValue: {
            getLogicalQuestionRender: jest.fn(),
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

  describe('caculatePlayingLogical', () => {
    it('should return game over if the game is finished', async () => {
      jest.spyOn(service, 'findLogicalAnswerPlaceHold').mockResolvedValue({
        game_result_id: 1,
        index: 20,
      } as LogicalGameResult);
      jest
        .spyOn(gameResultService, 'findOne')
        .mockResolvedValue(new GameResult());

      const result = await service.caculatePlayingLogical(183, true);
      console.log(result, 123456);

      expect(result.message).toBe('Game over');
    });
  });

  describe('findLogicalAnswerPlaceHold', () => {
    it('should throw BadRequestException if logicalGameResult does not exist', async () => {
      jest.spyOn(service, 'findLogicalGameResult').mockResolvedValue(null);

      await expect(service.findLogicalAnswerPlaceHold(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return logicalGameResult if it exists', async () => {
      const logicalGameResult = new LogicalGameResult();
      console.log(logicalGameResult);

      jest
        .spyOn(service, 'findLogicalGameResult')
        .mockResolvedValue(logicalGameResult);

      const result = await service.findLogicalAnswerPlaceHold(1);
      expect(result).toBe(logicalGameResult);
    });
  });

  describe('checkCorrectAnswer', () => {
    it('should return correct answer message and updated play score', async () => {
      const logicalGameResult = {
        logical_question: {
          correct_answer: true,
          score: 10,
        },
      } as LogicalGameResult;

      const result = await service.checkCorrectAnswer(
        true,
        0,
        logicalGameResult,
      );
      expect(result.isCorrect).toBe(true);
      expect(result.message).toBe('Your answer is true');
      expect(result.data.newPlayScore).toBe(10);
    });

    it('should return incorrect answer message and same play score', async () => {
      const logicalGameResult = {
        logical_question: {
          correct_answer: true,
          score: 10,
        },
      } as LogicalGameResult;

      const result = await service.checkCorrectAnswer(
        false,
        0,
        logicalGameResult,
      );
      expect(result.isCorrect).toBe(false);
      expect(result.message).toBe('Your answer is false');
      expect(result.data.newPlayScore).toBe(0);
    });
  });
});
