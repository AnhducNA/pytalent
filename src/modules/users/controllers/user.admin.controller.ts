import {
  Body,
  Controller,
  Post,
  Res,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { Response } from 'express';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { AuthorizationGuard } from '@guards/authorization.guard';
import { RoleEnum } from '@enum/role.enum';

@Controller('api/users/admin')
export class UserAdminController extends BaseController {
  constructor(private readonly usersService: UserService) {
    super();
  }

  @Post('')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    await this.usersService.checkOrCreateUser(createUserDto);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }
}
