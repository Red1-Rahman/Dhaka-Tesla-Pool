import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

// catches everything the app throws (NestJS HttpExceptions, raw Prisma errors,
// anything else) and always responds with the shape documented in
// docs/api-contracts.md. Fixes audit finding #6 (accept-race 500s leaking
// Prisma constraint text) and closes the matching leak vector in #14.
@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);
    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { statusCode: status, message: payload, error: exception.name };
      }
      const payloadObject = payload as Record<string, unknown>;
      return {
        statusCode: status,
        message: (payloadObject.message as string | string[]) ?? exception.message,
        error: (payloadObject.error as string) ?? exception.name,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'This resource was already claimed by another request',
          error: 'Conflict',
        };
      }
      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found',
          error: 'Not Found',
        };
      }
    }

    // anything unrecognized is logged server-side and never echoed to the client
    // eslint-disable-next-line no-console
    console.error(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
