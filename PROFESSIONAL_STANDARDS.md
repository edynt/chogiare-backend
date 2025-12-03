# Professional Standards Implementation Guide

## Overview

This document describes the professional standards implemented in the Chogiare Backend project, including message constants, logging, and header validation.

## 1. Message Constants

All user-facing messages are centralized in `src/common/constants/messages.constants.ts` and are in **English** only.

### Usage in DTOs

```typescript
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateProductDto {
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  title: string;
}
```

### Usage in Services

```typescript
import { MESSAGES } from '@common/constants/messages.constants';

throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
```

## 2. Logging System

### Logger Service

The `LoggerService` uses Winston for structured logging with:
- File-based logging (error.log, combined.log)
- Console logging in development
- Structured JSON format
- Automatic log rotation (5MB max, 5 files)

### Usage

```typescript
import { LoggerService } from '@common/logger/logger.service';

constructor(private readonly logger: LoggerService) {}

this.logger.log('User created', 'UserService', { userId: user.id });
this.logger.warn('Suspicious activity detected', 'SecurityService', { ip });
this.logger.error('Database error', error.stack, 'DatabaseService', { query });
```

### Log Levels

- `log()` - General information
- `error()` - Errors with stack traces
- `warn()` - Warnings
- `debug()` - Debug information (development only)
- `verbose()` - Verbose information

## 3. Header Validation

### HeaderValidationGuard

Automatically validates:
- Required headers: `user-agent`, `accept`
- Content-Type for POST/PUT/PATCH requests
- Suspicious headers detection (logging only)

### Skip Header Validation

For endpoints that need to skip header validation:

```typescript
import { SkipHeaderValidation } from '@common/decorators/skip-header-validation.decorator';

@SkipHeaderValidation()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

## 4. Response Transformation

### TransformInterceptor

All responses are automatically wrapped in a standard format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 5. Error Handling

### HttpExceptionFilter

All errors are caught and formatted consistently:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": null,
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/products/123"
  }
}
```

### Error Codes

Standardized error codes in `src/common/constants/error-codes.constants.ts`:
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONFLICT`
- `INTERNAL_ERROR`
- `INSUFFICIENT_STOCK`
- etc.

## 6. Logging Interceptor

Automatically logs:
- All incoming requests (method, URL, headers, body)
- All outgoing responses (status code, duration, size)
- All errors (stack trace, context)

Sensitive data (passwords, tokens) are automatically redacted.

## 7. File Structure

```
src/
  common/
    constants/
      messages.constants.ts      # All messages in English
      error-codes.constants.ts   # Standardized error codes
    logger/
      logger.service.ts          # Winston logger service
      logger.module.ts           # Logger module
    interceptors/
      logging.interceptor.ts     # Request/response logging
      transform.interceptor.ts  # Response transformation
    guards/
      header-validation.guard.ts # Header validation
      jwt-auth.guard.ts          # JWT authentication
    filters/
      http-exception.filter.ts   # Global error handler
    decorators/
      public.decorator.ts        # Public endpoint marker
      skip-header-validation.decorator.ts
      current-user.decorator.ts
```

## 8. Best Practices

### Messages

1. ✅ Always use constants from `MESSAGES` or `VALIDATION_MESSAGES`
2. ✅ Never hardcode messages in code
3. ✅ All messages must be in English
4. ✅ Use descriptive error codes

### Logging

1. ✅ Log all important operations (create, update, delete)
2. ✅ Log security-related events (login attempts, permission checks)
3. ✅ Log errors with stack traces
4. ✅ Include context (userId, resourceId, etc.)
5. ✅ Never log sensitive data (passwords, tokens)

### Headers

1. ✅ Always validate required headers
2. ✅ Check Content-Type for data-modifying requests
3. ✅ Log suspicious headers for security analysis
4. ✅ Use `@SkipHeaderValidation()` for health checks, webhooks

### Error Handling

1. ✅ Use appropriate HTTP status codes
2. ✅ Include error codes in responses
3. ✅ Provide helpful error messages
4. ✅ Log all errors with context

## 9. Migration Checklist

To update existing code to use these standards:

- [ ] Replace all hardcoded Vietnamese messages with constants
- [ ] Add logging to all service methods
- [ ] Update all DTOs to use `VALIDATION_MESSAGES`
- [ ] Update all services to use `MESSAGES`
- [ ] Add `LoggerModule` to all modules
- [ ] Test header validation
- [ ] Verify log files are created
- [ ] Check error responses format

## 10. Example: Complete Service Implementation

```typescript
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { MESSAGES } from '@common/constants/messages.constants';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly logger: LoggerService,
  ) {}

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      this.logger.warn(`Product not found: ${id}`, 'ProductService');
      throw new NotFoundException(MESSAGES.PRODUCT.NOT_FOUND);
    }

    this.logger.log(`Product retrieved: ${id}`, 'ProductService', {
      productId: id,
    });

    return product;
  }
}
```

## 11. Log Files

Logs are stored in:
- `logs/error.log` - Error level logs only
- `logs/combined.log` - All logs

Log files are automatically rotated when they reach 5MB, keeping the last 5 files.

## 12. Environment Variables

Add to `.env`:
```env
NODE_ENV=development  # or production
```

In production, logs will be written to files only (no console output).

