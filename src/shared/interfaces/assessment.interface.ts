export interface AssessmentInterface {
  id: number;
  hr_id: number;
  name: string;
  time_start: string;
  time_end: string;
}

export interface FindAssessmentInterface {
  hr_id: number;
  candidate_id: number;
  game_id: number;
}
export interface CreateAssessmentInterface {
  hr_id: number;
  name: string;
  time_start: Date;
  time_end: Date;
}

export type AssessmentGetResponse = Omit<
  AssessmentInterface,
  'hr_id' | 'name' | 'time_start' | 'time_end'
>;
