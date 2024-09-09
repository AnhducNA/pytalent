import { Test, TestingModule } from '@nestjs/testing';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultService } from './services/gameResult.service';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { StatusGameResultEnum } from '@common/enum/status-game-result.enum';
import { LogicalGameResultService } from './services/logicalGameResult.service';

describe('GameResultService', () => {
  let service: GameResultService;
  let gameResultRepository: Repository<GameResult>;
  let logicalGameResultService: LogicalGameResultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameResultService,
        {
          provide: getRepositoryToken(GameResult),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(MemoryGameResult),
          useValue: Repository,
        },
        {
          provide: LogicalGameResultService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<GameResultService>(GameResultService);
    gameResultRepository = module.get<Repository<GameResult>>(
      getRepositoryToken(GameResult),
    );
    logicalGameResultService = module.get<LogicalGameResultService>(
      LogicalGameResultService,
    );
  });

  describe('findAll', () => {
    it('should return an array of game results', async () => {
      const gameResults = [new GameResult(), new GameResult()];
      jest.spyOn(gameResultRepository, 'find').mockResolvedValue(gameResults);

      expect(await service.getAll()).toBe(gameResults);
    });
  });

  describe('findAndValidateGameResult', () => {
    it('should throw BadRequestException if ID is not provided', async () => {
      await expect(service.findAndValidateGameResult(null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if the game is finished', async () => {
      const gameResult = { id: 1, status: StatusGameResultEnum.FINISHED };
      jest
        .spyOn(gameResultRepository, 'findOne')
        .mockResolvedValue(gameResult as GameResult);

      await expect(service.findAndValidateGameResult(1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if the game is paused', async () => {
      const gameResult = { id: 1, status: StatusGameResultEnum.PAUSED };
      jest
        .spyOn(gameResultRepository, 'findOne')
        .mockResolvedValue(gameResult as GameResult);

      await expect(service.findAndValidateGameResult(78)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if the game time is over', async () => {
      const gameResult = {
        id: 1,
        status: StatusGameResultEnum.STARTED,
        time_start: new Date(),
      };
      jest
        .spyOn(gameResultRepository, 'findOne')
        .mockResolvedValue(gameResult as GameResult);
      jest.spyOn(service as any, 'validatePlayTime').mockResolvedValue(false);

      await expect(service.findAndValidateGameResult(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return the game result if all validations pass', async () => {
      const gameResult = {
        id: 1,
        status: StatusGameResultEnum.STARTED,
        time_start: new Date(),
      };
      jest
        .spyOn(gameResultRepository, 'findOne')
        .mockResolvedValue(gameResult as GameResult);
      jest.spyOn(service as any, 'validatePlayTime').mockResolvedValue(true);

      const result = await service.findAndValidateGameResult(1);
      expect(result).toBe(gameResult);
    });
  });

  describe('validatePlayTime', () => {
    it('should return false if play time exceeds total game time', async () => {
      const gameResult = { id: 1, time_start: new Date(Date.now() - 91000) };
      const totalGameTime = 90000; // 90 seconds
      jest.spyOn(service as any, 'getGameInfoByGameResult').mockResolvedValue({
        game: { total_time: totalGameTime },
      });

      const result = await service.validatePlayTime(
        gameResult.id,
        gameResult.time_start,
      );
      expect(result).toBe(false);
    });

    it('should return true if play time is within total game time', async () => {
      const gameResult = { id: 1, time_start: new Date(Date.now() - 80000) };
      const totalGameTime = 90000; // 90 seconds
      jest.spyOn(service as any, 'getGameInfoByGameResult').mockResolvedValue({
        game: { total_time: totalGameTime },
      });

      const result = await (service as any).validatePlayTime(
        gameResult.id,
        gameResult.time_start,
      );
      expect(result).toBe(true);
    });
  });
});
