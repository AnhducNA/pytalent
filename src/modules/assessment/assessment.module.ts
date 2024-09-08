import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from '@entities/assessment.entity';
import { checkLogin } from '@middleware/authentication.middleware';
import { AssessmentGame } from '@entities/assessmentGame.entity';
import { AssessmentCandidate } from '@entities/assessmentCandidate.entity';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { UserService } from '@modules/users/services/user.service';
import { User } from '@entities/user.entity';
import { HrGame } from '@entities/hrGame.entity';
import { MailServerService } from '@modules/mail_server/mail_server.service';
import { LogicalGameResultRepository } from '@modules/game_result/repositories/logicalGameResult.repository';
import { MemoryGameResultService } from '@modules/game_result/memoryGameResult.service';
import { GameResultRepository } from '@modules/game_result/repositories/gameResult.repository';
import { GameService } from '@modules/game/game.service';
import { Game } from '@entities/game.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { MemoryData } from '@entities/memoryData.entity';
import { AssessmentRepository } from './assessment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      AssessmentGame,
      AssessmentCandidate,
      GameResult,
      LogicalGameResult,
      MemoryGameResult,
      HrGame,
      User,
      Game,
      LogicalQuestion,
      MemoryData,
    ]),
  ],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    AssessmentRepository,
    GameResultService,
    UserService,
    MailServerService,
    MemoryGameResultService,
    GameService,
    LogicalGameResultRepository,
    GameResultRepository,
  ],
  exports: [
    AssessmentService,
    GameResultService,
    UserService,
    MailServerService,
  ],
})
export class AssessmentModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(checkLogin)
      .forRoutes(
        { path: 'api/assessments', method: RequestMethod.GET },
        { path: 'api/assessments', method: RequestMethod.POST },
      );
  }
}
