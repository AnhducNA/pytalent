import { RoleEnum } from '@enum/role.enum';

export interface UserModel {
  id: number;
  email: string;
  password: string;
  role: string;
}

export interface FindUserInterface {
  email: string;
  password: string;
}

export interface createUserInterface extends FindUserInterface {
  role: RoleEnum;
}

export interface IUserLogin {
  id: number;
  email: string;
  role: string;
}

export type UserGetResponse = Omit<UserModel, 'userId' | 'password'>;
