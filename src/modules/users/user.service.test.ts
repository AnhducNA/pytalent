import { Repository } from 'typeorm';
import { UserService } from './services/user.service';
import { User } from '@entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
const userArray = [
  {
    name: null,
    email: 'admin@gmail.com',
    password: '$2b$10$8NoeFbeBargsDsClhpfkDexfk0RtV6kDSJa/yTOwJ3Wbo3n6e3k/.',
    role: 'admin',
  },
];
describe('UserService', () => {
  let service: UserService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          // define all the methods that you use from the catRepo
          // give proper return values as expected or mock implementations, your choice
          useValue: {
            find: jest.fn().mockResolvedValue(userArray),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const cats = await service.findAll();
      expect(cats).toEqual(userArray);
    });
  });
});
