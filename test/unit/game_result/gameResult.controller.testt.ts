import { Test, TestingModule } from '@nestjs/testing';
import { GameResultController } from '../../../src/modules/game_result/controllers/gameResult.controller';
import { GameResultService } from '../../../src/modules/game_result/gameResult.service';

describe('GameResult Controller', () => {
  let controller: GameResultController;
  let service: GameResultService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameResultController],
    }).compile();
    controller = module.get<GameResultController>(GameResultController);
    service = module.get<GameResultService>(GameResultService);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should get an array of gameResult', async () => {
      await expect(controller.findAll()).resolves.toEqual([
        {
          name: 'Test Cat 1',
          breed: 'Test Breed 1',
          age: 1,
        },
        {
          name: 'Test Cat 2',
          breed: 'Test Breed 2',
          age: 3,
        },
        {
          name: 'Test Cat 3',
          breed: 'Test Breed 3',
          age: 2,
        },
      ]);
    });
  });
});
