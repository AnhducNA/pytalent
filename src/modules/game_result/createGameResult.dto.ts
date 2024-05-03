import { IsNotEmpty } from 'class-validator';

export class CreateGameResultDto {
  candidate_id: number;

  @IsNotEmpty()
  assessment_id: number;

  @IsNotEmpty()
  game_id: number;

  play_time: number;
  play_score: number;
  is_done: boolean;
  time_start: Date;
}
