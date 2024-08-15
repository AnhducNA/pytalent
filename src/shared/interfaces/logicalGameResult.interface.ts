import { GameResult } from '@entities/gameResult.entity';
import { LogicalQuestion } from '@entities/logicalQuestion.entity';
import { StatusLogicalGameResultEnum } from '@enum/status-logical-game-result.enum';

export interface IlogicalGameResult {
  id: number;
  index: number;
  game_result_id: number;
  logical_question_id: number;
  status: StatusLogicalGameResultEnum;
  answer_play: boolean;
  is_correct: boolean;
  game_result: GameResult[];
  logical_question: LogicalQuestion;
}

export interface createLogicalGameResultInterface {
  index: number;
  game_result_id: number;
  logical_question_id: number;
  status: StatusLogicalGameResultEnum;
  answer_play: boolean;
  is_correct: boolean;
}
