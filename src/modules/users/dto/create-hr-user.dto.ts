import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { RoleEnum } from '@enum/role.enum';
import { User } from '@entities/user.entity';
import { Exists } from '@shared/decorator/exists.decorator';

export class CreateHrUserDto {
  @IsNotEmpty()
  @IsEmail()
  @Exists(User, 'email')
  email: string;

  @IsNotEmpty()
  password: string;

  role: RoleEnum.HR;
}
