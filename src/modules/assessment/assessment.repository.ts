import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Assessment } from '@entities/assessment.entity';

@Injectable()
export class AssessmentRepository extends Repository<Assessment> {
  constructor(private dataSource: DataSource) {
    super(Assessment, dataSource.createEntityManager());
  }

  async getTimeEnd(id: number) {
    const assessment = await this.findOne({
      select: ['time_end'],
      where: { id },
    });
    if (!assessment) {
      throw new BadRequestException('Assessment does not exit');
    }
    return assessment.time_end;
  }

  async getOnetWithCandidate(id: number, candidateId: number) {
    const assessmentCandidates = await this.findOne({
      where: { id, candidates: { id: candidateId } },
    });
    return assessmentCandidates;
  }
}
