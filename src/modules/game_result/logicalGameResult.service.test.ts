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
            getGameResultUpdate: jest.fn(),
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

  describe('findLogicalAnswerPlaceHold', () => {
    it('should throw BadRequestException if logicalGameResult does not exist', async () => {
      jest.spyOn(service, 'findLogicalGameResult').mockResolvedValue(null);

      await expect(service.findLogicalAnswerPlaceHold(1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return logicalGameResult if it exists', async () => {
      const logicalGameResult = new LogicalGameResult();
      jest
        .spyOn(service, 'findLogicalGameResult')
        .mockResolvedValue(logicalGameResult);

      const result = await service.findLogicalAnswerPlaceHold(183);
      expect(result).toBe(logicalGameResult);
    });
  });

  describe('validateGameResult', () => {
    it('should return game over message if game result is finished', async () => {
      const gameResultStatus = StatusGameResultEnum.FINISHED;

      const result = await service.validateGameResult(
        73,
        new Date(),
        gameResultStatus,
        1,
      );
      expect(result.status).toBe(false);
      expect(result.message).toBe('Game over');
    });

    it('should return paused message if game result is paused', async () => {
      const gameResultStatus = StatusGameResultEnum.PAUSED;

      const result = await service.validateGameResult(
        73,
        new Date(),
        gameResultStatus,
        1,
      );
      expect(result.status).toBe(false);
      expect(result.message).toBe(
        'Game was paused. You need to continue to play',
      );
    });

    // it('should return game over message if play time exceeds total time', async () => {
    //   jest.spyOn(service as any, 'validatePlayTime').mockResolvedValue(true);

    //   const gameResultStatus = StatusGameResultEnum.STARTED;

    //   const result = await service.validateGameResult(
    //     1,
    //     new Date(),
    //     gameResultStatus,
    //     1,
    //   );
    //   expect(result.status).toBe(false);
    //   expect(result.message).toBe('Gaming time is over. End game.');
    // });

    // it('should return true if game is still valid', async () => {
    //   jest.spyOn(service as any, 'validatePlayTime').mockResolvedValue(true);

    //   const gameResultStatus = StatusGameResultEnum.STARTED;
    //   jest
    //     .spyOn(gameService, 'getTotalQuestionGameLogical')
    //     .mockResolvedValue(10);

    //   const result = await service.validateGameResult(
    //     1,
    //     new Date(),
    //     gameResultStatus,
    //     1,
    //   );
    //   expect(result.status).toBe(true);
    // });
  });

  describe('checkCorrectAnswer', () => {
    it('should return correct answer message and updated play score', async () => {
      const result = await service.checkCorrectAnswer(true, 15, true, 2);
      console.log(12456, result);

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
});
