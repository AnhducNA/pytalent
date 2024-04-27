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
export class LogicalGameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @PrimaryColumn({ name: 'game_result_id' })
  game_result_id: number;

  @Column()
  logical_game_id: number;

  @Column()
  correct_answer: boolean;

  @Column()
  answer_play: boolean;

  @Column({ nullable: true })
  is_correct: boolean;

  @ManyToOne(() => GameResult, (gameResult) => gameResult.id, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'game_result_id', referencedColumnName: 'id' }])
  gameResult: GameResult;
}
