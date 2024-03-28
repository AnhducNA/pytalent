import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@modules/users/repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { User } from '@entities/user.entity';
import { plainToClass } from 'class-transformer';
import {
  createUserInterface,
  FindUserInterface,
} from '@interfaces/user.interface';
import { RoleEnum } from '@enum/role.enum';

@Injectable()
export class UserService {
  constructor(private usersRepository: UsersRepository) {}

  async findAll() {
    const userList = await this.usersRepository.find();
    return userList;
  }

  async checkOrCreateUser(params: FindUserInterface) {
    let user: User = await this.usersRepository.findOne({
      where: {
        email: params.email,
      },
    });
    if (!user) {
      const paramCreate: createUserInterface = plainToClass(User, {
        email: params.email,
        password: await bcrypt.hash(params.password, 10),
        role: RoleEnum.HR,
      });
      user = await this.usersRepository.create(paramCreate);
    }
    return user;
  }
}
