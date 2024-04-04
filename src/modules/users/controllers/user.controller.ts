import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { Response } from 'express';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { AuthGuard } from '@guards/auth.guard';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';

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
  @Post()
  // @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const result = await this.userService.checkOrCreateUser(createUserDto);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }
  @Get('hr-approach-game/:hrId')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.ADMIN)
  async getHrApproachGame(@Request() req, @Res() res: Response) {
    const hrId = req.params['hrId'];
    const hrApprachGameList = await this.userService.getHrApproachGameByHrId(
      hrId,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      data: hrApprachGameList,
      message: 'Get data success!',
    });
  }
  @Post('hr-approach-game')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.ADMIN)
  async createHrApproachGame(
    @Body() hrGameListDto: { hr_id: number; game_id_list: any },
    @Res() res: Response,
  ) {
    const { hr_id, game_id_list } = hrGameListDto;
    if (hr_id && game_id_list) {
      for (const game_id of game_id_list) {
        //   create data
        const hrGameDto = { hr_id: hr_id, game_id: game_id };
        const hrGameResult =
          await this.userService.getHrApprachGameByHrIdAndGameId(hrGameDto);
        if (!hrGameResult) {
          await this.userService.createHrApproachGame(hrGameDto);
        }
      }
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Create data success!',
      });
    } else {
      return res.status(HttpStatus.OK).json({
        success: false,
        message: "Don't have data!",
      });
    }
  }
}
