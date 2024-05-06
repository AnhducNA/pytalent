import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { GameResult } from '@entities/gameResult.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';

@Entity()
export class LogicalGameResult extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  index: number;

  @Column()
  game_result_id: number;

  @Column()
  logical_question_id: number;

  @Column()
  status: StatusLogicalGameResultEnum;

  @Column()
  answer_play: boolean;

  @Column({ nullable: true })
  is_correct: boolean;

  @ManyToOne(() => GameResult)
  @JoinColumn([{ name: 'game_result_id', referencedColumnName: 'id' }])
  game_result: GameResult;

  @ManyToOne(() => LogicalQuestion)
  @JoinColumn([
    {
      name: 'logical_question_id',
      referencedColumnName: 'id',
    },
  ])
  logical_question: LogicalQuestion;
}
