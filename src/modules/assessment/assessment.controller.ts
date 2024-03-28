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
} from '@nestjs/common';
import { Assessment } from '@entities/assessment.entity';
import { AssessmentService } from './assessment.service';
import { Response } from 'express';
import { CreateAssessmentDto } from '@modules/assessment/create-assessment.dto';
import { BaseController } from '@modules/app/base.controller';

@Controller('api/assessments')
export class AssessmentController extends BaseController {
  constructor(private readonly assessmentService: AssessmentService) {
    super();
  }

  //get all assessments
  @Get()
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
    @Body() assessmentDto: CreateAssessmentDto,
    @Res() res: Response,
  ) {
    const result = await this.assessmentService.create(assessmentDto);
    console.log(result, 123);
    return this.successResponse(
      {
        message: 'success',
      },
      res,
    );
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
