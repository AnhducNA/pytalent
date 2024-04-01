import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class AssessmentGame extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  assessment_id: number;

  @Column()
  game_id: number;
}
