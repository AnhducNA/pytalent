import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import databaseConfig from '../../databases/config/index';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  CookieResolver,
  I18nModule,
} from 'nestjs-i18n';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from '@modules/users/user.module';
import { AuthModule } from '@modules/auth/auth.module';
import { GameModule } from '@modules/game/game.module';

import { HppMiddleware } from '@middleware/hpp.middleware';
import { User } from '@entities/user.entity';
import { Game } from '@entities/game.entity';
import { AssessmentModule } from '@modules/assessment/assessment.module';
import { Assessment } from '@entities/assessment.entity';
import { GameResult } from '@entities/gameResult.entity';
import { GameResultModule } from '@modules/game_result/gameResult.module';

const options = databaseConfig as TypeOrmModuleOptions;

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),

    TypeOrmModule.forFeature([User, Game, Assessment, GameResult]),

    TypeOrmModule.forRoot({
      ...options,
      autoLoadEntities: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../../', '/i18n/'),
        watch: true,
      },
      resolvers: [new CookieResolver(), AcceptLanguageResolver],
    }),

    //other module
    UserModule,
    GameModule,
    AuthModule,
    AssessmentModule,
    GameResultModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HppMiddleware).forRoutes('*');
  }
}
