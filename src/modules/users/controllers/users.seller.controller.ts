import { Controller } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { BaseController } from '@modules/app/base.controller';

@Controller('sellers/users')
export class UsersSellerController extends BaseController {
  constructor(private readonly usersService: UserService) {
    super();
  }
}
