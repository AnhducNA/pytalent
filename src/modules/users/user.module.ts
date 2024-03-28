import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UsersSellerController } from './controllers/users.seller.controller';
import { UsersMemberController } from '@modules/users/controllers/users.member.controller';
import { UsersRepository } from '@modules/users/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@entities/index';
import { UserAdminController } from '@modules/users/controllers/user.admin.controller';
import { UserController } from '@modules/users/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [
    UserController,
    UsersSellerController,
    UserAdminController,
    UsersMemberController,
  ],
  providers: [UserService, UsersRepository],
  exports: [UserService, UsersRepository],
})
export class UserModule {}
