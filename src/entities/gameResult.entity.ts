import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Game } from '@entities/game.entity';
import { Assessment } from '@entities/assessment.entity';
import { MemoryGameResult } from '@entities/memoryGameResult.entity';
import { LogicalGameResult } from '@entities/logicalGameResult.entity';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';

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
  status: StatusGameResultEnum;

  @Column({ nullable: true })
  time_start: Date;

  @OneToMany(
    () => LogicalGameResult,
    (logical_game_result) => logical_game_result.game_result,
  )
  logical_game_result_list: LogicalGameResult[];

  @OneToMany(
    () => MemoryGameResult,
    (memory_game_result) => memory_game_result.game_result,
  )
  memory_game_result_list: MemoryGameResult[];

  @ManyToOne(() => Game)
  @JoinColumn({ name: 'game_id', referencedColumnName: 'id' })
  game: Game;

  @ManyToOne(() => Assessment)
  @JoinColumn({ name: 'assessment_id', referencedColumnName: 'id' })
  assessment: Assessment;
}
