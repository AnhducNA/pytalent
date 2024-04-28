import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Assessment } from '@entities/assessment.entity';
import { AssessmentService } from './assessment.service';
import { Response } from 'express';
import { BaseController } from '@modules/app/base.controller';
import { RoleEnum } from '@enum/role.enum';
import { AuthGuard } from '@guards/auth.guard';
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { AuthorizationGuard } from '@guards/authorization.guard';
import { GameResultService } from '@modules/game_result/gameResult.service';
import { UserService } from '@modules/users/services/user.service';

const currentDate = new Date();

@Controller('api/assessments')
@UseGuards(AuthGuard)
export class AssessmentController extends BaseController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly gameResultService: GameResultService,
    private readonly userService: UserService,
  ) {
    super();
  }

  //get all assessments
  @Get('/list')
  @UseGuards(JwtAuthGuard, new AuthorizationGuard([RoleEnum.ADMIN]))
  findAll(): Promise<Assessment[]> {
    return this.assessmentService.findAll();
  }

  @Get('assessment-by-hr/:hr_id')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  getAssessmentByHrId(@Request() req: any) {
    const hr_id = req.params.hr_id;
    return this.assessmentService.getAssessmentByHrId(hr_id);
  }

  @Get('assessment-by-candidate_login')
  @UseGuards(JwtAuthGuard)
  async getAssessmentByCandidateId(@Req() req: any, @Res() res: any) {
    const candidate_login = req['userLogin'];
    return this.successResponse(
      {
        data: {
          candidate_login: candidate_login,
          assessment_candidate:
            await this.assessmentService.getAssessmentByCandidateId(
              candidate_login.id,
            ),
        },
      },
      res,
    );
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async findOne(@Req() req: any, @Res() res: any) {
    const id = req.params.id;
    const assessment_result = await this.assessmentService.findOne(id);
    const assessment_game_list =
      await this.assessmentService.getAssessmentGameByAssessmentId(id);
    const assessment_candidate_list =
      await this.assessmentService.get_assessment_candidate_and_game_result_by_assessment_id(
        id,
      );
    const game_result =
      await this.assessmentService.getGameResultByAssessmentId(id);
    return this.successResponse(
      {
        data: {
          assessment: assessment_result,
          assessment_game_list: assessment_game_list,
          assessment_candidate_list: assessment_candidate_list,
          game_result: game_result,
        },
      },
      res,
    );
  }

  @Get('get-game-by-assessment/:assessment_id')
  async getGameByAssessmentId(@Req() req: any, @Res() res: any) {
    const assessment_id = req.params.assessment_id;
    const dataResult = await this.assessmentService.getGameByAssessmentId(
      assessment_id,
    );
    return this.successResponse(
      {
        data: dataResult,
        message: 'success',
      },
      res,
    );
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async create(
    @Request() req: any,
    @Body()
    assessmentDto: {
      name: string;
      hr_id: number;
      game_list: any;
      candidate_list: any;
      time_start: Date;
      time_end: Date;
    },
    @Res() res: Response,
  ) {
    assessmentDto.hr_id = req['userLogin'].id;
    if (!assessmentDto.time_start) {
      assessmentDto.time_start = currentDate;
    }
    if (assessmentDto.time_end) {
      assessmentDto.time_end = new Date(assessmentDto.time_end);
    }
    const new_assessment = await this.assessmentService.create(assessmentDto);
    return this.successResponse(
      {
        message: 'success',
        data: {
          assessment: new_assessment,
          game_list: assessmentDto.game_list,
          candidate_list: assessmentDto.candidate_list,
        },
      },
      res,
    );
  }

  @Patch('update')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async update(
    @Body()
    assessmentDto: {
      id: number;
      name: string;
      hr_id: number;
      time_start: string;
      time_end: string;
      game_id_list: any;
      candidate_id_list: any;
    },
    @Res() res: Response,
  ) {
    await this.assessmentService.update(assessmentDto);
    return this.successResponse(
      {
        message: 'success',
        data: assessmentDto,
      },
      res,
    );
  }

  @Post('hr-invite-candidate')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async hrInviteCandidate(
    @Body()
    paramsDto: {
      assessment_id: number;
      candidate_list: any;
    },
    @Res() res: Response,
  ) {
    if (!paramsDto.candidate_list) {
      return this.errorsResponse(
        {
          message: `candidate_list don't have data`,
        },
        res,
      );
    } else {
      // validate assessment
      const checkAssessment = await this.assessmentService.findOne(
        paramsDto.assessment_id,
      );
      if (checkAssessment) {
        await this.assessmentService.delete_assessment_candidate_by_assessment_id(
          paramsDto.assessment_id,
        );
        let assessmentCandidateListResult = [];
        for (const candidate_email of paramsDto.candidate_list) {
          const payloadUser = {
            email: candidate_email,
            password: '123456',
          };
          const userResult = await this.userService.checkOrCreateUser(
            payloadUser,
          );
          const payloadAssessmentCandidate = {
            assessment_id: paramsDto.assessment_id,
            candidate_id: userResult.id,
          };
          const assessmentCandidateResult =
            await this.assessmentService.create_assessment_candidate(
              payloadAssessmentCandidate,
            );
          assessmentCandidateListResult = [
            ...assessmentCandidateListResult,
            assessmentCandidateResult,
          ];
        }
        return this.successResponse(
          {
            message: 'success',
            data: assessmentCandidateListResult,
          },
          res,
        );
      } else {
        return this.errorsResponse(
          {
            message: 'assessment does not exit.',
          },
          res,
        );
      }
    }
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    new AuthorizationGuard([RoleEnum.ADMIN, RoleEnum.HR]),
  )
  async delete(@Req() req: any, @Res() res: Response) {
    const id = req.params.id;
    await this.gameResultService.deleteGameResultByAssessmentId(id);
    const result = await this.assessmentService.delete(id);
    if (result?.affected > 0) {
      return this.successResponse(
        {
          message: 'success',
        },
        res,
      );
    } else {
      return this.errorsResponse(
        {
          message: 'error',
        },
        res,
      );
    }
  }
}
