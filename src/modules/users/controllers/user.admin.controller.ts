import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { CreateUserDto } from '@modules/users/dto/create-user.dto';
import { Response } from 'express';
import { UserService } from '@modules/users/services/user.service';
import { BaseController } from '@modules/app/base.controller';
import { AuthorizationGuard } from '@guards/authorization.guard';
import { RoleEnum } from '@enum/role.enum';

@Controller('api/user/admin')
export class UserAdminController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Post('create-hr-account')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async createHrAccount(
    @Body()
    createUserDto: {
      email: string;
      password: string;
      role: RoleEnum;
    },
    @Res() res: Response,
  ) {
    createUserDto.role = RoleEnum.HR;
    const result = await this.userService.createUser(createUserDto);
    return this.successResponse(
      {
        message: 'success',
        data: result,
      },
      res,
    );
  }

  @Post('')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async create(
    @Request() req: any,
    @Body() createUserDto: CreateUserDto,
    @Res() res: Response,
  ) {
    await this.userService.checkOrCreateUser(createUserDto);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }

  @Get('hr-approach-game/:hrId')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async getHrApproachGame(@Request() req: any, @Res() res: Response) {
    const hrId = req.params['hrId'];
    const hrApproachGameList = await this.userService.getHrApproachGameByHrId(
      hrId,
    );
    return res.status(HttpStatus.OK).json({
      success: true,
      data: hrApproachGameList,
      message: 'Get data success!',
    });
  }

  @Post('hr-approach-game')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  async createHrApproachGame(
    @Body() hrGameListDto: { hr_id: number; game_id_list: any },
    @Res() res: Response,
  ) {
    const { hr_id, game_id_list } = hrGameListDto;
    // validate hr_id
    const hr = await this.userService.findOne(hr_id);
    if (!hr) {
      return this.errorsResponse(
        {
          message: `HR account does not exist!`,
        },
        res,
      );
    }
    if (hr_id && game_id_list) {
      let hr_approach_game_result: any = [];
      await this.userService.deleteHrGameByHrId(hr_id);
      for (const game_id of game_id_list) {
        //   create data
        const hrGameDto = { hr_id: hr_id, game_id: game_id };
        hr_approach_game_result = [
          ...hr_approach_game_result,
          await this.userService.createHrApproachGame(hrGameDto),
        ];
      }
      return this.successResponse(
        {
          message: 'Create data success!',
          data: hr_approach_game_result,
        },
        res,
      );
    } else {
      return this.errorsResponse(
        {
          message: `Don't have data!`,
        },
        res,
      );
    }
  }
}
