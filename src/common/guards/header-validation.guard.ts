import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { LoggerService } from '../logger/logger.service';
import { SKIP_HEADER_VALIDATION_KEY } from '../decorators/skip-header-validation.decorator';
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class HeaderValidationGuard implements CanActivate {
  constructor(
    private readonly logger: LoggerService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skipValidation = this.reflector.getAllAndOverride<boolean>(
      SKIP_HEADER_VALIDATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipValidation) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headers = request.headers;

    const requiredHeaders = ['user-agent', 'accept'];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        this.logger.warn(
          `Missing required header: ${header}`,
          'HeaderValidationGuard',
          {
            url: request.url,
            method: request.method,
            ip: request.ip,
          },
        );
        throw new BadRequestException(`${MESSAGES.HEADER.MISSING_REQUIRED}: ${header}`);
      }
    }

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        this.logger.warn(
          'Invalid Content-Type header',
          'HeaderValidationGuard',
          {
            url: request.url,
            method: request.method,
            contentType,
          },
        );
        throw new BadRequestException(MESSAGES.HEADER.INVALID_CONTENT_TYPE);
      }
    }

    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
    ];

    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        this.logger.warn(
          `Suspicious header detected: ${header}`,
          'HeaderValidationGuard',
          {
            url: request.url,
            method: request.method,
            header,
            value: headers[header],
          },
        );
      }
    }

    return true;
  }
}

