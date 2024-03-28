import {
  Body,
  Controller,
  Get, Param, Post, Request, Res,
} from '@nestjs/common';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { Response } from 'express';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';

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
        message: 'success',
      },
      res,
    );
  }

  @Get(':id')
  async findOne(
    @Res() res: Response,
    @Param() params
  ){
    const dataResult = await this.userService.findOne(params.id);
    return this.successResponse(
      {
        data: dataResult,
        message: 'success',
      },
      res,
    );
  }

  @Post()
  // @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    const result = await this.userService.checkOrCreateUser(createUserDto);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }
}
