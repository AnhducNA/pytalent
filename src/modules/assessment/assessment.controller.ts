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
  findOne(@Param() params) {
    return this.assessmentService.findOne(params.id);
  }

  @Post()
  async create(
    @Request() req,
    @Body() assessmentDto: object,
    @Res() res: Response,
  ) {
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
  update(@Body() assessment: Assessment) {
    return this.assessmentService.update(assessment);
  }

  @Delete(':id')
  delete(@Param() params) {
    return this.assessmentService.delete(params.id);
  }
}
