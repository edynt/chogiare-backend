import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          `Outgoing Response: ${method} ${url} ${statusCode} - ${duration}ms`,
          JSON.stringify({
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(data).length,
          }),
        );
      }),
      catchError((error) => {
        if (!(error instanceof HttpException)) {
          const duration = Date.now() - startTime;
          const statusCode = (error as { status?: number }).status || 500;

          this.logger.error(
            `Request Failed: ${method} ${url} ${statusCode} - ${duration}ms`,
            (error as Error).stack,
            JSON.stringify({
              method,
              url,
              statusCode,
              duration: `${duration}ms`,
              error: {
                message: (error as Error).message,
                name: (error as Error).name,
              },
            }),
          );
        }

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
