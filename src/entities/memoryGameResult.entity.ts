import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class MemoryGameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  game_result_id: number;

  @Column()
  memory_game_id: number;

  @Column()
  answer_play: string;

  @Column()
  is_correct: boolean;
}
