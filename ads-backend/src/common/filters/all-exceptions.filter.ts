import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  /** Stable machine-readable code the web app can switch on. */
  code?: string;
  details?: unknown;
  requestId?: string;
  path: string;
  timestamp: string;
}

const STATUS_NAMES: Partial<Record<number, string>> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  503: 'Service Unavailable',
};

/** One error shape for the whole API, and no stack traces or internals in responses. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const requestId = (request as Request & { id?: string }).id;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code: string | undefined;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const payload = body as Record<string, unknown>;
        if (typeof payload.message === 'string' || Array.isArray(payload.message)) {
          message = payload.message as string | string[];
        }
        if (typeof payload.code === 'string') code = payload.code;
        if (payload.details !== undefined) details = payload.details;
      }
    } else if (this.isExposedClientError(exception)) {
      // Raised by the HTTP stack before Nest sees the request, e.g. an oversized body.
      status = exception.status;
      message = status === HttpStatus.PAYLOAD_TOO_LARGE ? 'Request body too large' : exception.message;
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.originalUrl} [${requestId ?? '-'}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorBody = {
      statusCode: status,
      error: STATUS_NAMES[status] ?? 'Error',
      message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
      ...(requestId ? { requestId } : {}),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(body);
  }

  /** `http-errors` marks a 4xx error as safe to show with `expose: true`. */
  private isExposedClientError(exception: unknown): exception is { status: number; message: string } {
    if (typeof exception !== 'object' || exception === null) return false;
    const { status, expose, message } = exception as Record<string, unknown>;
    return typeof status === 'number' && status >= 400 && status < 500 && expose === true && typeof message === 'string';
  }
}
