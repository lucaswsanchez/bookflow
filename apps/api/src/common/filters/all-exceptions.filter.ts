import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Postgres exclusion-constraint violation (overlapping appointments). */
export function isOverlapError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes('23P01') || msg.includes('Appointment_no_overlap');
}

/**
 * Turns every error into the same JSON shape so clients can rely on
 * { statusCode, error, message, path, timestamp }.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'A record with the same unique value already exists';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.CONFLICT;
        message = 'The resource is referenced by other records';
      }
    } else if (isOverlapError(exception)) {
      status = HttpStatus.CONFLICT;
      message = 'The selected time slot is no longer available';
    }

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const payload: ErrorResponse = {
      statusCode: status,
      error: (HttpStatus[status] as string | undefined)?.replace(/_/g, ' ') ?? 'ERROR',
      message,
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(payload);
  }
}
