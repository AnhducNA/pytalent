import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@enum/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RoleEnum[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    // get the roles required
    if (!roles) {
      throw new UnauthorizedException();
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Access the user details
    return roles.some((role) => user.role.includes(role));
  }
}
