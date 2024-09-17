import { StatusGameResultEnum } from '@enum/status-game-result.enum';

export interface gameResultModel {
  id: number;
  candidate_id: number;
  assessment_id: number;
  game_id: number;
  play_time: number;
  play_score: number;
  status: StatusGameResultEnum;
  time_start: Date;
}

export interface createGameResultInterface {
  candidate_id: number;
  assessment_id: number;
  game_id: number;
  play_time: number;
  play_score: number;
  status: StatusGameResultEnum;
  time_start: Date;
}

export interface IgetHistoryAnswered {
  logicalQuestionId: number;
  correctAnswer: boolean;
}
