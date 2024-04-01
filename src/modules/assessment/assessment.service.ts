import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Assessment } from '@entities/assessment.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

@Injectable()
export class AssessmentService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
  ) {}

  async findAll(): Promise<Assessment[]> {
    return this.assessmentRepository.find();
  }

  async findOne(id: number): Promise<Assessment> {
    return await this.assessmentRepository.findOneBy({ id: id });
  }

  async create(params: object) {
    return await this.assessmentRepository.save(params);
  }

  async update(user: Assessment): Promise<UpdateResult> {
    return await this.assessmentRepository.update(user.id, user);
  }

  async delete(id): Promise<DeleteResult> {
    return await this.assessmentRepository.delete(id);
  }
}
