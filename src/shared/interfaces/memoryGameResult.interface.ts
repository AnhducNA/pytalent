export interface memoryGameResultModel {
  id: number;
  game_result_id: number;
  memory_game_id: number;
  correct_answer: string;
  answer_play: string;
  is_correct: boolean;
  time_start_play_level: Date;
}

export interface createMemoryGameResultInterface {
  game_result_id: number;
  memory_game_id: number;
  correct_answer: string;
  answer_play: string;
  is_correct: boolean;
  time_start_play_level: Date;
}
