import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class MemoryData extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: number;

  @Column()
  time_limit: number;

  @Column()
  score: number;
}
