import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { ERROR_CODES } from '../constants/error-codes.constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = ERROR_CODES.INTERNAL_ERROR;
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.errorCode || this.getErrorCode(status);
        details = responseObj.details || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.loggerService.error(
        exception.message,
        exception.stack,
        'HttpExceptionFilter',
        {
          url: request.url,
          method: request.method,
        },
      );
    }

    // Log error
    this.loggerService.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      'HttpExceptionFilter',
      {
        url: request.url,
        method: request.method,
        statusCode: status,
        errorCode,
        details,
        userId: (request as any).user?.id,
      },
    );

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }
}

