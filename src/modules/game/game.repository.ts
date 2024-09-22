import { Game } from '@entities/game.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GameRepository extends Repository<Game> {
  constructor(private dataSource: DataSource) {
    super(Game, dataSource.createEntityManager());
  }
  async getTimeOfGame(id: number) {
    const game = await this.findOne({
      select: ['id', 'total_time'],
      where: { id },
    });
    return game.total_time;
  }
}
