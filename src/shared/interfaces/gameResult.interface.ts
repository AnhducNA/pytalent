export interface gameResultModel {
  id: number;
  candidate_id: number;
  assessment_id: number;
  game_id: number;
  play_time: number;
  play_score: number;
  is_done: boolean;
}

export interface createGameResultInterface {
  candidate_id: number;
  assessment_id: number;
  game_id: number;
  play_time: number;
  play_score: number;
  is_done: boolean;
}
