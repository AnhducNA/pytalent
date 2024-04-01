import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    next();
  }
}

export function checkLogin(req: Request, res: Response, next: NextFunction) {
  console.log(`Middleware checkLogin...`);
  next();
}
