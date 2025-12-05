import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = request.ip || request.connection.remoteAddress;
    const startTime = Date.now();

    const contextName = `${context.getClass().name}.${context.getHandler().name}`;

    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      contextName,
      {
        method,
        url,
        query,
        params,
        body: this.sanitizeBody(body),
        userAgent,
        ip,
      },
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          `Outgoing Response: ${method} ${url} ${statusCode}`,
          contextName,
          {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
          },
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `Request Failed: ${method} ${url} ${statusCode}`,
          error.stack,
          contextName,
          {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            error: {
              message: error.message,
              name: error.name,
            },
          },
        );

        throw error;
      }),
    );
  }

  private sanitizeBody(body: unknown): Record<string, unknown> | unknown {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...(body as Record<string, unknown>) };
    const sensitiveFields = ['password', 'hashedPassword', 'token', 'refreshToken'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}

