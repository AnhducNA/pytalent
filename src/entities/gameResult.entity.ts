import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class GameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  candidate_id: number;

  @Column()
  game_id: number;

  @Column()
  play_time: string;

  @Column()
  play_score: number;
}
