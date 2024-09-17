import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { MemoryGameResultRepository } from './repositories/memoryGameResult.repository';
import { GameResultService } from './services/gameResult.service';

describe('GameResultService', () => {
  describe('#getTotalPlayScoreByGameResult()', () => {
    const table = [
      {
        params: { gameResultId: 1, gameId: 1 },
        logicalScores: [10, 20],
        memoryScores: [],
        expected: 30,
      },
      {
        params: { gameResultId: 2, gameId: 2 },
        logicalScores: [],
        memoryScores: [15, 25],
        expected: 40,
      },
      {
        params: { gameResultId: 3, gameId: 3 },
        logicalScores: [],
        memoryScores: [],
        expected: 0,
      },
    ];

    test.each(table)(
      'params: $params',
      async ({ params, logicalScores, memoryScores, expected }) => {
        const logicalAnswerRepository = {
          getScoresOfCorrectAnswer: jest.fn().mockResolvedValue(logicalScores),
        } as unknown as LogicalGameResultRepository;

        const memoryAnswerRepository = {
          getScoresOfCorrectAnswer: jest.fn().mockResolvedValue(memoryScores),
        } as unknown as MemoryGameResultRepository;
        const service = new GameResultService(
          {} as any, // No need to mock gameResultRepository for this test
          logicalAnswerRepository,
          memoryAnswerRepository,
        );

        // Spy on the private method calls indirectly by using `jest.spyOn`
        const logicalSpy = jest.spyOn(
          logicalAnswerRepository,
          'getScoresOfCorrectAnswer',
        );
        const memorySpy = jest.spyOn(
          memoryAnswerRepository,
          'getScoresOfCorrectAnswer',
        );

        const result = await service.getTotalPlayScoreByGameResult(
          params.gameResultId,
          params.gameId,
        );

        expect(result).toEqual(expected);

        if (params.gameId === 1) {
          expect(logicalSpy).toHaveBeenCalledWith(params.gameResultId);
        } else if (params.gameId === 2) {
          expect(memorySpy).toHaveBeenCalledWith(params.gameResultId);
        } else {
          expect(logicalSpy).not.toHaveBeenCalled();
          expect(memorySpy).not.toHaveBeenCalled();
        }
      },
    );
  });
});
