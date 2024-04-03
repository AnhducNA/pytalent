import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class MemoryGame extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: number;

  @Column()
  data: string;

  @Column()
  score: number;
}
