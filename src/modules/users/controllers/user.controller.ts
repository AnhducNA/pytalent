import {
  Controller,
  Get, Res,
} from '@nestjs/common';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { Response } from 'express';

@Controller('api/users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Get()
  async findAll(@Res() res: Response) {
    const userList = await this.userService.findAll();
    return this.successResponse(
      {
        data: userList,
        message: 'success',
      },
      res,
    );
  }
}
