export interface AssessmentModel {
  id: number;
  hr_id: number;
  candidate_id: number;
  game_id: number;
  result_player: string;
}

export interface FindAssessmentInterface {
  hr_id: number;
  candidate_id: number;
  game_id: number;
}
export interface createAssessmentInterface extends FindAssessmentInterface {}

export type AssessmentGetResponse = Omit<AssessmentModel, 'hr_id' | 'candidate_id' | 'game_id' | 'result_player'>;
