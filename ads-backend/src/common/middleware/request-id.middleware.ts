import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Gives every request an id (honouring a sane incoming X-Request-Id) and echoes it back. */
export function requestId(request: Request, response: Response, next: NextFunction): void {
  const incoming = request.header('x-request-id');
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  (request as Request & { id?: string }).id = id;
  response.setHeader('X-Request-Id', id);
  next();
}
