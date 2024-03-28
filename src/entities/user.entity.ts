import 'reflect-metadata';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { RoleEnum } from '@enum/role.enum';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  role: RoleEnum;
}
