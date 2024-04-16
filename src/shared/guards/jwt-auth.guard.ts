import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private request: any) {
    super();
  }
  canActivate(context: ExecutionContext) {
    this.request = context.switchToHttp().getRequest();
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    } else {
      this.request['userLogin'] = user;
      return user;
    }
  }
}
