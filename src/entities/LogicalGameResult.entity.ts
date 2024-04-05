import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class LogicalGameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  game_result_id: number;

  @Column()
  logical_game_id: number;

  @Column()
  answer: boolean;
}
