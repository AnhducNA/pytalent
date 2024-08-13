import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { User } from '@entities/user.entity';

@Entity()
export class AssessmentCandidate extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  assessment_id: number;

  @Column()
  candidate_id: number;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'candidate_id', referencedColumnName: 'id' }])
  candidate: User;
}
