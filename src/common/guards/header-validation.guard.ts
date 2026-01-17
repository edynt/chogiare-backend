import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SKIP_HEADER_VALIDATION_KEY } from '../decorators/skip-header-validation.decorator';
import { MESSAGES } from '../constants/messages.constants';

@Injectable()
export class HeaderValidationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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
      // Check if request has body using Content-Length header
      const contentLength = headers['content-length'];
      const hasBody = contentLength && parseInt(contentLength, 10) > 0;

      // Only validate Content-Type when body actually present
      if (hasBody) {
        const contentType = headers['content-type'];
        // Allow both application/json and multipart/form-data (for file uploads)
        const isValidContentType =
          contentType &&
          (contentType.includes('application/json') || contentType.includes('multipart/form-data'));
        if (!isValidContentType) {
          throw new BadRequestException(MESSAGES.HEADER.INVALID_CONTENT_TYPE);
        }
      }
    }

    return true;
  }
}
