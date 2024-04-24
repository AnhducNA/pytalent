import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { AssessmentGame } from '@entities/assessmentGame.entity';

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
  response_rate: string;

  @Column()
  note: string;

  @Column()
  scoring: string;

  @OneToMany(
    (type) => AssessmentGame,
    (assessment_game) => assessment_game.game_id,
  )
  assessment_games: AssessmentGame[];
}
