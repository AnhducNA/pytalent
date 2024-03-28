import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Assessment } from '@entities/assessment.entity';
import { AssessmentService } from './assessment.service';

@Controller('api/assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

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
  create(@Body() assessment: Assessment) {
    return this.assessmentService.create(assessment);
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
