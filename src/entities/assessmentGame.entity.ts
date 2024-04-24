import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Game } from '@entities/game.entity';

@Entity()
export class AssessmentGame extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  assessment_id: number;

  @Column()
  game_id: number;

  @ManyToOne(() => Game, (game) => game.assessment_games, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'game_id', referencedColumnName: 'id' }])
  game: Game;
}
