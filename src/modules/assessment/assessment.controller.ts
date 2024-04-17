import {
  Body,
  Controller,
  Delete,
  Get,
  Param, Patch,
  Post,
  Put,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Assessment } from '@entities/assessment.entity';
import { AssessmentService } from './assessment.service';
import { Response } from 'express';
import { BaseController } from '@modules/app/base.controller';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { AuthGuard } from '@guards/auth.guard';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { AuthorizationGuard } from '@guards/authorization.guard';
import { GameResultService } from '@modules/game_result/gameResult.service';

const currentDate = new Date();

@Controller('api/assessments')
@UseGuards(AuthGuard)
export class AssessmentController extends BaseController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly gameResultService: GameResultService,
  ) {
    super();
  }

  //get all assessments
  @Get('/list')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  findAll(): Promise<Assessment[]> {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  @RolesDecorator(RoleEnum.ADMIN, RoleEnum.HR)
  findOne(@Param() params) {
    return this.assessmentService.findOne(params.id);
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async create(
    @Request() req,
    @Body() assessmentDto: object,
    @Res() res: Response,
  ) {
    if (!assessmentDto['time_start']) {
      assessmentDto['time_start'] = currentDate
        .toJSON()
        .slice(0, 19)
        .replace('T', ':');
    }
    const result = await this.assessmentService.create(assessmentDto);
    if (!result) {
      return this.errorsResponse(
        {
          message: 'error',
        },
        res,
      );
    } else {
      return this.successResponse(
        {
          message: 'success',
        },
        res,
      );
    }
  }

  @Patch('update')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async update(@Body() assessmentDto: {
    id: number,
    name: string,
    hr_id: number,
    time_start: string,
    time_end: string,
    game_id_list: any,
    candidate_email_list: any,
  }, @Res() res: Response) {
    if (!assessmentDto['time_start']) {
      assessmentDto['time_start'] = currentDate
        .toJSON()
        .slice(0, 19)
        .replace('T', ':');
    }
    const result = await this.assessmentService.update(assessmentDto);
    if (!result) {
      return this.errorsResponse(
        {
          message: 'error',
        },
        res,
      );
    } else {
      return this.successResponse(
        {
          message: 'success',
        },
        res,
      );
    }
  }

  @Post('hr-invite-candidate')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async hrInviteCandidate(
    @Body()
    paramsDto: {
      assessment_id: number;
      candidate_list: any;
    },
    @Res() res: Response,
  ) {
    await this.assessmentService.hrInviteCandidate(paramsDto);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async delete(@Req() req: any, @Res() res: Response) {
    const id = req.params.id;
    await this.gameResultService.deleteGameResultByAssessmentId(id);
    const result = await this.assessmentService.delete(id);
    if (result?.affected > 0) {
      return this.successResponse(
        {
          message: 'success',
        },
        res,
      );
    } else {
      return this.errorsResponse(
        {
          message: 'error',
        },
        res,
      );
    }
  }
}
