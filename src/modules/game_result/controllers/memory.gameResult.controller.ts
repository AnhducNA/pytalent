import { Controller } from '@nestjs/common';
import { BaseController } from '@modules/app/base.controller';

@Controller('api/memory-game-result')
export class GameResultController extends BaseController {}
