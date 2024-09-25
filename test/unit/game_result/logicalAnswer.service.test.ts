import { GameService } from '@modules/game/game.service';
import { LogicalGameResultService } from '../../../src/modules/game_result/services/logicalAnswer.service';
import { LogicalGameResultRepository } from '../../../src/modules/game_result/repositories/logicalGameResult.repository';

describe('LogicalGameResultService', () => {
  describe('#validateLogicalAnswer()', () => {
    const table = [
      {
        idLogicalAnswer: 1,
        indexQuestion: 5,
        totalQuestion: 4,
        expected: {
          status: false,
          message: 'You have completed the game. End game.',
        },
      },
      {
        idLogicalAnswer: 1,
        indexQuestion: 3,
        totalQuestion: 5,
        expected: {
          status: true,
          message: 'success',
        },
      },
    ];

    test.each(table)(
      'indexQuestion: $indexQuestion and totalQuestion: $totalQuestion',
      async ({ idLogicalAnswer, indexQuestion, totalQuestion, expected }) => {
        const gameService = {
          getTotalQuestionGameLogical: jest
            .fn()
            .mockResolvedValue(totalQuestion),
        } as unknown as GameService;

        const service = new LogicalGameResultService(
          {} as any, // Not used in this test
          {} as any, // Not used in this test
          gameService,
        );

        const result = await service.validateLogicalAnswer(
          idLogicalAnswer,
          indexQuestion,
        );
        expect(result).toEqual(expected);
        expect(gameService.getTotalQuestionGameLogical).toHaveBeenCalled();
      },
    );
  });

  describe('#isFinalQuestion()', () => {
    const table = [
      {
        indexQuestion: 20,
        totalQuestion: 20,
        expected: true,
      },
      {
        indexQuestion: 18,
        totalQuestion: 20,
        expected: false,
      },
    ];

    test.each(table)(
      'indexQuestion: $indexQuestion and totalQuestion: $totalQuestion',
      async ({ indexQuestion, totalQuestion, expected }) => {
        const gameService = {
          getTotalQuestionGameLogical: jest
            .fn()
            .mockResolvedValue(totalQuestion),
        } as unknown as GameService;

        const service = new LogicalGameResultService(
          {} as any,
          {} as any,
          gameService,
        );

        const result = await service.isFinalQuestion(indexQuestion);
        expect(result).toBe(expected);
        expect(gameService.getTotalQuestionGameLogical).toHaveBeenCalled();
      },
    );
  });

  // Test for checkCorrectAnswer function
  describe('#checkCorrectAnswer()', () => {
    const table = [
      {
        params: {
          answerPlay: true,
          play_score: 50,
          correctAnswer: true,
          scoreQuestion: 10,
        },
        expected: {
          isCorrect: true,
          message: 'Your answer is true',
          data: { newPlayScore: 60 },
        },
      },
      {
        params: {
          answerPlay: false,
          play_score: 40,
          correctAnswer: true,
          scoreQuestion: 10,
        },
        expected: {
          isCorrect: false,
          message: 'Your answer is false',
          data: { newPlayScore: 40 },
        },
      },
      {
        params: {
          answerPlay: true,
          play_score: 30,
          correctAnswer: false,
          scoreQuestion: 5,
        },
        expected: {
          isCorrect: false,
          message: 'Your answer is false',
          data: { newPlayScore: 30 },
        },
      },
    ];

    test.each(table)('params: $params', async ({ params, expected }) => {
      const service = new LogicalGameResultService(
        {} as any,
        {} as any,
        {} as any,
      );

      const result = await service.checkCorrectAnswer(
        params.answerPlay,
        params.play_score,
        params.correctAnswer,
        params.scoreQuestion,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('#getHistoryAnswered()', () => {
    const table = [
      {
        gameResultId: 1,
        findResult: [
          {
            logical_question_id: 101,
            logical_question: { correct_answer: true },
          },
          {
            logical_question_id: 102,
            logical_question: { correct_answer: false },
          },
        ],
        expected: [
          { logicalQuestionId: 101, correctAnswer: true },
          { logicalQuestionId: 102, correctAnswer: false },
        ],
      },
      {
        gameResultId: 2,
        findResult: [
          {
            logical_question_id: 201,
            logical_question: { correct_answer: false },
          },
        ],
        expected: [{ logicalQuestionId: 201, correctAnswer: false }],
      },
      {
        gameResultId: 3,
        findResult: [],
        expected: [],
      },
    ];

    test.each(table)(
      'gameResultId: $gameResultId',
      async ({ gameResultId, findResult, expected }) => {
        const logicalAnswerRepository = {
          find: jest.fn().mockResolvedValue(findResult),
        } as unknown as LogicalGameResultRepository;

        const service = new LogicalGameResultService(
          logicalAnswerRepository,
          {} as any, // No need to mock other repositories for this test
          {} as any, // No need to mock gameService for this test
        );

        const result = await service.getHistoryAnswered(gameResultId);
        expect(result).toEqual(expected);
        expect(logicalAnswerRepository.find).toHaveBeenCalledWith({
          relations: ['logical_question'],
          where: { game_result_id: gameResultId },
        });
      },
    );
  });
});
