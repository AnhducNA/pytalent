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
import { MemoryData } from '@entities/memoryData.entity';

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

  @Column({ nullable: true })
  answer_play: string;

  @Column({ nullable: true })
  is_correct: boolean;

  @Column({ nullable: true })
  time_start_play_level: Date;

  @ManyToOne(() => GameResult, (gameResult) => gameResult.id, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'game_result_id', referencedColumnName: 'id' }])
  gameResults: GameResult[];

  @ManyToOne(() => MemoryData)
  @JoinColumn([{ name: 'memory_game_id', referencedColumnName: 'id' }])
  memory_game: MemoryData;
}
