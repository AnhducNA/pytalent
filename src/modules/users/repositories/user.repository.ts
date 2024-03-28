import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '@entities/index';
import { User } from '@entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async findAllUsers(): Promise<any> {
    return await this.find();
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.findOne({ where: { email: email } });
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
