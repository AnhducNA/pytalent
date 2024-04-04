import { RoleEnum } from '@enum/role.enum';
import { SetMetadata } from '@nestjs/common';

export const RolesDecorator = (...roles: RoleEnum[]) => {
  return SetMetadata('roles', roles);
};
