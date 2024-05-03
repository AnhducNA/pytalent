export interface logicalGameResultModel {
  id: number;
  index: number;
  game_result_id: number;
  logical_question_id: number;
  answer_play: boolean;
  is_correct: boolean;
}

export interface createLogicalGameResultInterface {
  index: number;
  game_result_id: number;
  logical_question_id: number;
  answer_play: boolean;
  is_correct: boolean;
}
