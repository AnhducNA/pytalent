import { GameService } from '@modules/game/game.service';
import { LogicalGameResultService } from '../services/logicalAnswer.service';
import { LogicalGameResultRepository } from '../repositories/logicalGameResult.repository';
import { GameResultRepository } from '../repositories/gameResult.repository';

describe('LogicalGameResultService', () => {
  describe('#calculatePlayingLogical()', () => {
    const table = [
      {
        id: 1,
        answerPlay: true,
        answerPlaceHold: {
          id: 1,
          game_result_id: 10,
          index: 1,
          logical_question: { correct_answer: true, score: 10 },
        },
        gameResultUpdate: {
          id: 10,
          play_score: 50,
          time_start: new Date(),
        },
        validateResponse: { status: true, message: 'Valid' },
        checkCorrectAnswer: {
          isCorrect: true,
          message: 'Correct',
          data: { newPlayScore: 60 },
        },
        isFinalQuestion: false,
        nextQuestion: {
          id: 2,
          statement1: 'Next Statement 1',
          statement2: 'Next Statement 2',
          conclusion: 'Next Conclusion',
          score: 20,
        },
        expected: {
          message: 'Correct',
          data: {
            logicalQuestionNext: {
              logicalGameResultId: 2,
              logicalQuestionId: 2,
              index: 2,
              statement1: 'Next Statement 1',
              statement2: 'Next Statement 2',
              conclusion: 'Next Conclusion',
              score: 20,
            },
          },
        },
      },
    ];

    test.each(table)(
      'id: $id and answerPlay: $answerPlay',
      async ({
        id,
        answerPlay,
        answerPlaceHold,
        gameResultUpdate,
        validateResponse,
        checkCorrectAnswer,
        isFinalQuestion,
        nextQuestion,
        expected,
      }) => {
        const logicalAnswerRepository = {
          getOne: jest.fn().mockResolvedValue(answerPlaceHold),
          updateStatusAnswered: jest.fn(),
        } as unknown as LogicalGameResultRepository;

        const gameResultRepository = {
          getOne: jest.fn().mockResolvedValue(gameResultUpdate),
          validateGameResult: jest.fn(),
          updatePlayTimeAndScore: jest.fn(),
          updateFinishGame: jest.fn(),
        } as unknown as GameResultRepository;

        const gameService = {
          getLogicalQuestionRender: jest.fn().mockResolvedValue(nextQuestion),
        } as unknown as GameService;

        const service = new LogicalGameResultService(
          logicalAnswerRepository,
          gameResultRepository,
          gameService,
        );

        jest
          .spyOn(service, 'validateLogicalAnswer')
          .mockResolvedValue(validateResponse);
        jest
          .spyOn(service, 'checkCorrectAnswer')
          .mockResolvedValue(checkCorrectAnswer);
        jest
          .spyOn(service, 'isFinalQuestion')
          .mockResolvedValue(isFinalQuestion);
        jest.spyOn(service, 'getNextLogicalQuestion').mockResolvedValue({
          logicalGameResultId: nextQuestion?.id || null,
          logicalQuestionId: nextQuestion?.id || null,
          index: 2,
          statement1: nextQuestion?.statement1 || '',
          statement2: nextQuestion?.statement2 || '',
          conclusion: nextQuestion?.conclusion || '',
          score: nextQuestion?.score || 0,
        });

        const result = await service.calculatePlayingLogical(id, answerPlay);
        expect(result).toEqual(expected);

        if (validateResponse.status === false) {
          expect(gameResultRepository.updateFinishGame).toHaveBeenCalledWith(
            gameResultUpdate.id,
          );
        }

        if (!isFinalQuestion && nextQuestion) {
          expect(service.getNextLogicalQuestion).toHaveBeenCalledWith(
            answerPlaceHold.index,
            gameResultUpdate.id,
          );
        }
        expect(
          gameResultRepository.updatePlayTimeAndScore,
        ).toHaveBeenCalledWith({
          id: gameResultUpdate.id,
          playTime: expect.any(Number),
          playScore: checkCorrectAnswer.data.newPlayScore,
        });

        expect(
          logicalAnswerRepository.updateStatusAnswered,
        ).toHaveBeenCalledWith(
          answerPlaceHold.id,
          answerPlay,
          checkCorrectAnswer.isCorrect,
        );
      },
    );
  });
});
