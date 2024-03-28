import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Assessment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hr_id: number;

  @Column()
  candidate_id: number;

  @Column()
  game_id: number;

  @Column()
  time_start: Date;

  @Column()
  time_end: Date;

}
