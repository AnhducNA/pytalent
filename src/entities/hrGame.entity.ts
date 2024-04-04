import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';

@Entity()
export class HrGame extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  hr_id: number;

  @Column()
  game_id: number;
}
