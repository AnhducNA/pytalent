import { RoleEnum } from '@enum/role.enum';
import { SetMetadata } from '@nestjs/common';

export const RolesDecorator = (...roles: RoleEnum[]) =>
  SetMetadata('roles', roles);
