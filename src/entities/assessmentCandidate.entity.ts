import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class AssessmentCandidate extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  assessment_id: number;

  @Column()
  candidate_id: number;

}
