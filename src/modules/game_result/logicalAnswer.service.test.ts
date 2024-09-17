import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '@modules/game/game.service';
import { LogicalGameResultService } from './services/logicalAnswer.service';
import { LogicalGameResultRepository } from './repositories/logicalGameResult.repository';
import { GameResultRepository } from './repositories/gameResult.repository';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';

describe('LogicalGameResultService', () => {
  let service: LogicalGameResultService;
  let logicalAnswerRepository: jest.Mocked<LogicalGameResultRepository>;
  let gameService: jest.Mocked<GameService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalGameResultService,
        {
          provide: LogicalGameResultRepository,
          useValue: {
            getOne: jest.fn(),
            updateStatusAnswered: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GameResultRepository,
          useValue: {
            getOne: jest.fn(),
            validateGameResult: jest.fn(),
            updateFinishGame: jest.fn(),
            updatePlayTimeAndScore: jest.fn(),
          },
        },
        {
          provide: GameService,
          useValue: {
            getTotalQuestionGameLogical: jest.fn(),
            getLogicalQuestionRender: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LogicalGameResultService>(LogicalGameResultService);
    logicalAnswerRepository = module.get<LogicalGameResultRepository>(
      LogicalGameResultRepository,
    ) as jest.Mocked<LogicalGameResultRepository>;
    gameService = module.get<GameService>(
      GameService,
    ) as jest.Mocked<GameService>;
  });

  describe('#validateLogicalQuestion()', () => {
    const testCases = [
      {
        params: { indexQuestion: 5 },
        setup: async () => {
          gameService.getTotalQuestionGameLogical.mockResolvedValue(20);
        },
        expected: {
          status: true,
          message: 'success',
        },
      },
      {
        params: { indexQuestion: 50 },
        setup: async () => {
          gameService.getTotalQuestionGameLogical.mockResolvedValue(20);
        },
        expected: {
          status: false,
          message: 'You have completed the game. End game.',
        },
      },
    ];

    test.each(testCases)(
      'params: $params',
      async ({ params, setup, expected }) => {
        await setup(); // Mock data setup
        const result = await service.validateLogicalQuestion(
          params.indexQuestion,
        );
        expect(result).toEqual(expected);
      },
    );
  });

  describe('#isFinalQuestion()', () => {
    const testCases = [
      {
        params: { indexQuestion: 20 },
        setup: async () => {
          gameService.getTotalQuestionGameLogical.mockResolvedValue(20);
        },
        expected: true,
      },
      {
        params: { indexQuestion: 15 },
        setup: async () => {
          gameService.getTotalQuestionGameLogical.mockResolvedValue(20);
        },
        expected: false,
      },
    ];

    test.each(testCases)(
      'params: $params',
      async ({ params, setup, expected }) => {
        await setup(); // Mock setup
        const result = await service.isFinalQuestion(params.indexQuestion);
        expect(result).toEqual(expected);
      },
    );
  });

  describe('#checkCorrectAnswer()', () => {
    const testCases = [
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
          data: { newPlayScore: 60 }, // Score should increase by 10
        },
      },
      {
        params: {
          answerPlay: false,
          play_score: 50,
          correctAnswer: true,
          scoreQuestion: 10,
        },
        expected: {
          isCorrect: false,
          message: 'Your answer is false',
          data: { newPlayScore: 50 }, // Score remains unchanged
        },
      },
    ];

    test.each(testCases)('params: $params', async ({ params, expected }) => {
      const result = await service.checkCorrectAnswer(
        params.answerPlay,
        params.play_score,
        params.correctAnswer,
        params.scoreQuestion,
      ); // Call the method being tested
      expect(result).toEqual(expected); // Assert the result
    });
  });
  describe('#getHistoryAnswered()', () => {
    const testCases = [
      {
        params: { gameResultId: 1 },
        setup: async () => {
          logicalAnswerRepository.find.mockResolvedValue([
            {
              id: 101,
              game_result_id: 1,
              logical_question_id: 201,
              logical_question: { correct_answer: true },
            },
            {
              id: 102,
              game_result_id: 1,
              logical_question_id: 202,
              logical_question: { correct_answer: false },
            },
          ] as LogicalGameResult[]);
        },
        expected: [
          { logicalQuestionId: 201, correctAnswer: true },
          { logicalQuestionId: 202, correctAnswer: false },
        ],
      },
      {
        params: { gameResultId: 2 },
        setup: async () => {
          logicalAnswerRepository.find.mockResolvedValue([]);
        },
        expected: [],
      },
    ];

    test.each(testCases)(
      'params: $params',
      async ({ params, setup, expected }) => {
        await setup();
        const result = await service.getHistoryAnswered(params.gameResultId);
        expect(result).toEqual(expected);
      },
    );
  });
});
