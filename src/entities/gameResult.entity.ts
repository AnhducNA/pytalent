import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class GameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  candidate_id: number;

  @Column()
  assessment_id: number;

  @Column()
  game_id: number;

  @Column({ nullable: true })
  play_time: number;

  @Column({ nullable: true })
  play_score: number;

  @Column({ nullable: true })
  is_done: boolean;
}
