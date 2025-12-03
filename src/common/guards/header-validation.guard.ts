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

    // Required headers
    const requiredHeaders = ['user-agent', 'accept'];

    // Check required headers
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
        throw new BadRequestException(`Missing required header: ${header}`);
      }
    }

    // Validate Content-Type for POST/PUT/PATCH requests
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
        throw new BadRequestException(
          'Content-Type must be application/json',
        );
      }
    }

    // Block suspicious headers
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
        // Log but don't block - might be legitimate in some setups
      }
    }

    return true;
  }
}

