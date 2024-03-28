import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '@modules/auth/jwt.strategy';
import { AuthController } from '@modules/auth/auth.controller';
import { env } from '@env';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: env.jwt.secret,
      signOptions: { expiresIn: env.jwt.expires },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
