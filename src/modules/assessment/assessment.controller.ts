import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Assessment } from '@entities/assessment.entity';
import { AssessmentService } from './assessment.service';
import { Response } from 'express';
import { BaseController } from '@modules/app/base.controller';
import { RolesGuard } from '@guards/roles.guard';
import { RolesDecorator } from '@shared/decorator/roles.decorator';
import { RoleEnum } from '@enum/role.enum';
import { AuthGuard } from '@guards/auth.guard';

const currentdate = new Date();

@Controller('api/assessments')
export class AssessmentController extends BaseController {
  constructor(private readonly assessmentService: AssessmentService) {
    super();
  }

  //get all assessments
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  findAll(): Promise<Assessment[]> {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  findOne(@Param() params) {
    return this.assessmentService.findOne(params.id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  async create(
    @Request() req,
    @Body() assessmentDto: object,
    @Res() res: Response,
  ) {
    if (!assessmentDto['time_start']) {
      assessmentDto['time_start'] = currentdate
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

  @Put()
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  async update(@Body() assessmentDto: any, @Res() res: Response) {
    if (!assessmentDto['time_start']) {
      assessmentDto['time_start'] = currentdate
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
  @Put('invite-candidate')
  @UseGuards(AuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.HR)
  async inviteCandidate(@Body() assessmentDto: object, @Res() res: Response) {
    const result = await this.assessmentService.inviteCandidate(assessmentDto);
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
  @Delete(':id')
  delete(@Param() params) {
    return this.assessmentService.delete(params.id);
  }
}
