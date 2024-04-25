import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { GameResult } from '@entities/gameResult.entity';

@Entity()
export class MemoryGameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @PrimaryColumn({ name: 'game_result_id' })
  game_result_id: number;

  @Column()
  memory_game_id: number;

  @Column({ nullable: true })
  correct_answer: string;

  @Column()
  answer_play: string;

  @Column()
  is_correct: boolean;

  @ManyToOne(() => GameResult, (gameResult) => gameResult.id, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'game_result_id', referencedColumnName: 'id' }])
  gameResults: GameResult[];
}
