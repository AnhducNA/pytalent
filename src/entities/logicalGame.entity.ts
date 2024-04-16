import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class LogicalGame extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  statement1: string;

  @Column()
  statement2: string;

  @Column()
  conclusion: string;

  @Column()
  correct_answer: boolean;

  @Column()
  score: number;
}
