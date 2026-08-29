import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'] as string | undefined;
    const id = incoming && incoming.length >= 8 ? incoming : randomUUID();
    (req as any).requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
  }
}
