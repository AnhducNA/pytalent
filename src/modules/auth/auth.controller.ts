import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { BaseController } from '@modules/app/base.controller';
import { Response } from 'express';
import { CustomizeException } from '@exception/customize.exception';
import { UserService } from '@modules/users/services/user.service';
import { logger } from '@logs/app.log';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { AssessmentService } from '@modules/assessment/assessment.service';

@Controller('api/auth')
export class AuthController extends BaseController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private assessmentService: AssessmentService,
  ) {
    super();
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const userCheck = await this.userService.checkOrCreateUser(loginDto);
      const token = await this.authService.login(loginDto);
      if (token) {
        return this.successResponse(
          {
            message: 'Login success',
            data: {
              token: token,
              data: userCheck,
            },
          },
          res,
        );
      } else {
        return this.errorsResponse(
          {
            data: {
              success: false,
              message: 'Login fail',
            },
          },
          res,
        );
      }
    } catch (e) {
      logger.error('login errors: ' + e.message);
      throw new CustomizeException(
        e.message.toString(),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login-candidate')
  async loginCandidate(
    @Body()
    loginCandidateDto: { email_candidate: string; assessment_id: number },
    @Res() res: Response,
  ) {
    try {
      const userCheck = await this.userService.checkOrCreateUser({
        email: loginCandidateDto.email_candidate,
        password: '123456',
      });
      // validate, sign token
      const token = await this.authService.login({
        email: loginCandidateDto.email_candidate,
        password: '123456',
      });
      if (token) {
        return this.successResponse(
          {
            message: 'Login success',
            data: {
              token: token,
              data: {
                candidate_login: userCheck,
              },
            },
          },
          res,
        );
      } else {
        return this.errorsResponse(
          {
            message: 'Login fail',
            data: {
              success: false,
            },
          },
          res,
        );
      }
    } catch (e) {
      logger.error('login errors: ' + e.message);
      throw new CustomizeException(
        e.message.toString(),
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
