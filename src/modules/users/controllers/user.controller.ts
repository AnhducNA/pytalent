import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { Response } from 'express';
import { RoleEnum } from '@enum/role.enum';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { AuthorizationGuard } from '@guards/authorization.guard';

@Controller('api/users')
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Get('/list')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async findAll(@Res() res: Response) {
    const userList = await this.userService.findAll();
    return this.successResponse(
      {
        message: 'success',
        data: userList,
      },
      res,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Req() req: any, @Res() res: Response) {
    const userLogin = req['userLogin'];
    const dataResult = await this.userService.findOne(userLogin.id);
    return this.successResponse(
      {
        data: dataResult,
        message: 'success',
      },
      res,
    );
  }

  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  @Get(':id')
  async findOne(@Req() req: any, @Res() res: Response) {
    const dataResult = await this.userService.findOne(req.params.id);
    return this.successResponse(
      {
        data: dataResult,
        message: 'success',
      },
      res,
    );
  }
}
