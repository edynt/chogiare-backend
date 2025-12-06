import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
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
    const skipValidation = this.reflector.getAllAndOverride<boolean>(SKIP_HEADER_VALIDATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipValidation) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headers = request.headers;

    const requiredHeaders = ['user-agent', 'accept'];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        throw new BadRequestException(`${MESSAGES.HEADER.MISSING_REQUIRED}: ${header}`);
      }
    }

    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        throw new BadRequestException(MESSAGES.HEADER.INVALID_CONTENT_TYPE);
      }
    }

    return true;
  }
}
