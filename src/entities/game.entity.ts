import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class Game extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  game_type: string;

  @Column()
  status: string;

  @Column()
  description: string;

  @Column()
  total_time: string;

  @Column()
  total_question: string;

  @Column()
  detail: string;

  @Column()
  assessment_id: number;
}
