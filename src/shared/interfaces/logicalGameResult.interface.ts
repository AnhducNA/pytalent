import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';

export interface logicalGameResultModel {
  id: number;
  index: number;
  game_result_id: number;
  logical_question_id: number;
  status: StatusLogicalGameResultEnum;
  answer_play: boolean;
  is_correct: boolean;
}

export interface createLogicalGameResultInterface {
  index: number;
  game_result_id: number;
  logical_question_id: number;
  status: StatusLogicalGameResultEnum;
  answer_play: boolean;
  is_correct: boolean;
}
