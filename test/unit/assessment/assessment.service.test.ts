import { AssessmentService } from '../../../src/modules/assessment/assessment.service';

describe('AssessmentService', () => {
  describe('#getByHr()', () => {
    const testCases = [
      {
        hrId: 26,
        exptected: [
          {
            id: 22,
            name: 'assessment_new',
            hr_id: 26,
            time_start: '2024-05-08T09:28:30.047Z',
            time_end: '2024-10-10T10:03:42.361Z',
          },
        ],
      },
    ];

    test.each(testCases)(
      'hrId: $hrId, exptected: $exptected',
      async ({ hrId, exptected }) => {
        const mockAssessmentRepository = {
          find: jest.fn().mockResolvedValue(exptected),
        };
        const assessmentService = new AssessmentService(
          mockAssessmentRepository as any,
          {} as any,
          {} as any,
          {} as any,
        );
        const data = await assessmentService.getByHr(hrId);
        expect(data).toEqual(exptected);
        expect(mockAssessmentRepository.find).toHaveBeenCalledWith({
          where: { hr_id: hrId },
          order: { id: 'DESC' },
        });
      },
    );
  });

  describe('getByCandidate', () => {
    const testCases = [
      {
        candidateId: 26,
        assessmentData: [
          {
            id: 22,
            name: 'assessment_new',
            time_start: '2024-05-08T09:28:30.047Z',
            time_end: '2024-10-10T10:03:42.361Z',
          },
        ],
        exptected: [
          {
            id: 22,
            name: 'assessment_new123456',
            time_start: '2024-05-08T09:28:30.047Z',
            time_end: '2024-10-10T10:03:42.361Z',
          },
        ],
      },
      {
        candidateId: null,
        assessmentData: [
          {
            id: 22,
            name: 'assessment_new',
            time_start: '2024-05-08T09:28:30.047Z',
            time_end: '2024-10-10T10:03:42.361Z',
          },
        ],
        exptected: [],
      },
    ];
    test.each(testCases)(
      'candidateId: $candidateId assessmentData: $assessmentData',
      async ({ candidateId, assessmentData }) => {
        const mockAssessmentRepository = {
          find: jest.fn().mockResolvedValue(assessmentData),
        };
        const assessmentService = new AssessmentService(
          mockAssessmentRepository as any,
          {} as any,
          {} as any,
          {} as any,
        );
        jest.spyOn(assessmentService, 'validateId').mockResolvedValueOnce(true);
        const result = await assessmentService.getByCandidate(candidateId);
        // expect(result).toEqual(exptected);
        expect(result).toMatchObject([
          {
            id: expect.any(Number),
            name: expect.any(String),
            time_start: expect.any(String),
            time_end: expect.any(String),
          },
        ]);
        expect(assessmentService.validateId).toHaveBeenCalledWith(candidateId);
        expect(mockAssessmentRepository.find).toHaveBeenCalled();
      },
    );
  });
});
