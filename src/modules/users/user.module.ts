import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserHrController } from '@modules/users/controllers/user.hr.controller';
import { UsersRepository } from '@modules/users/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@entities/index';
import { UserAdminController } from '@modules/users/controllers/user.admin.controller';
import { UserController } from '@modules/users/controllers/user.controller';
import { HrGame } from '@entities/hrGame.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, HrGame])],
  controllers: [UserController, UserAdminController, UserHrController],
  providers: [UserService, UsersRepository],
  exports: [UserService, UsersRepository],
})
export class UserModule {}
