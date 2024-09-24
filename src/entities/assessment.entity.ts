import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Game } from './game.entity';

@Entity()
export class Assessment extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  hr_id: number;

  @Column()
  time_start: Date;

  @Column()
  time_end: Date;

  @ManyToMany(() => User, (user) => user.assessments)
  @JoinTable({
    name: 'assessment_candidate',
    joinColumn: {
      name: 'assessment_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'candidate_id',
      referencedColumnName: 'id',
    },
  })
  candidates: User[];

  @ManyToMany(() => Game)
  @JoinTable({
    name: 'assessment_game',
    joinColumn: {
      name: 'assessment_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'game_id',
      referencedColumnName: 'id',
    },
  })
  games: Game[];
}
