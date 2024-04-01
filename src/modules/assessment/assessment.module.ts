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

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, AssessmentGame])],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
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
