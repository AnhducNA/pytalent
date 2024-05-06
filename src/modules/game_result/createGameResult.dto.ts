import { IsNotEmpty } from 'class-validator';
import { StatusGameResultEnum } from '@enum/status-game-result.enum';

export class CreateGameResultDto {
  candidate_id: number;

  @IsNotEmpty()
  assessment_id: number;

  @IsNotEmpty()
  game_id: number;

  play_time: number;
  play_score: number;
  status: StatusGameResultEnum;
  time_start: Date;
}
