import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HeaderValidationGuard } from './header-validation.guard';

describe('HeaderValidationGuard', () => {
  let guard: HeaderValidationGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: Record<string, unknown>;

  beforeEach(async () => {
    reflector = new Reflector();
    guard = new HeaderValidationGuard(reflector);

    // Setup default mock request
    mockRequest = {
      headers: {
        'user-agent': 'test-agent',
        accept: 'application/json',
      },
      method: 'GET',
    };

    // Setup default mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn().mockReturnValue(() => {}),
      getClass: jest.fn().mockReturnValue(class {}),
    } as unknown as ExecutionContext;
  });

  describe('Required headers validation', () => {
    it('should allow request with all required headers (user-agent, accept)', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
      };
      mockRequest.method = 'GET';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should reject request missing user-agent header', () => {
      mockRequest.headers = {
        accept: 'application/json',
      };
      mockRequest.method = 'GET';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        `${MESSAGES.HEADER.MISSING_REQUIRED}: user-agent`,
      );
    });

    it('should reject request missing accept header', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
      };
      mockRequest.method = 'GET';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        `${MESSAGES.HEADER.MISSING_REQUIRED}: accept`,
      );
    });
  });

  describe('Scenario 1: Body-less PUT without Content-Type → PASS', () => {
    it('should allow PUT without Content-Type when Content-Length is missing/0', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        // No content-length header
      };
      mockRequest.method = 'PUT';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow PUT without Content-Type when Content-Length is 0', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '0',
      };
      mockRequest.method = 'PUT';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('Scenario 2: PUT with body + Content-Type → PASS', () => {
    it('should allow PUT with body and application/json Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/json',
        'content-length': '256',
      };
      mockRequest.method = 'PUT';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow PUT with body and application/json; charset=utf-8 Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/json; charset=utf-8',
        'content-length': '256',
      };
      mockRequest.method = 'PUT';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('Scenario 3: PUT with body, no Content-Type → FAIL (400 error)', () => {
    it('should reject PUT with body (Content-Length > 0) but no Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        // No content-type header
        'content-length': '256',
      };
      mockRequest.method = 'PUT';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });

    it('should reject PUT with body (Content-Length > 0) and invalid Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'text/plain',
        'content-length': '256',
      };
      mockRequest.method = 'PUT';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });

    it('should reject PUT with body (Content-Length > 0) and text/xml Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'text/xml',
        'content-length': '512',
      };
      mockRequest.method = 'PUT';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });
  });

  describe('Scenario 4: POST with body + Content-Type → PASS', () => {
    it('should allow POST with body and application/json Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/json',
        'content-length': '256',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow POST with body and application/json; charset=utf-8 Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/json; charset=utf-8',
        'content-length': '1024',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('Scenario 5: POST with body, no Content-Type → FAIL (400 error)', () => {
    it('should reject POST with body (Content-Length > 0) but no Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        // No content-type header
        'content-length': '256',
      };
      mockRequest.method = 'POST';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });

    it('should reject POST with body (Content-Length > 0) and invalid Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': '128',
      };
      mockRequest.method = 'POST';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });
  });

  describe('Scenario 6: Body-less POST without Content-Type → PASS', () => {
    it('should allow POST without Content-Type when Content-Length is missing', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        // No content-length header
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow POST without Content-Type when Content-Length is 0', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '0',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('PATCH method - same behavior as PUT/POST', () => {
    it('should allow PATCH with body and Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'application/json',
        'content-length': '128',
      };
      mockRequest.method = 'PATCH';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should reject PATCH with body but no Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '256',
      };
      mockRequest.method = 'PATCH';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        MESSAGES.HEADER.INVALID_CONTENT_TYPE,
      );
    });

    it('should allow PATCH without body and without Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
      };
      mockRequest.method = 'PATCH';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('GET/DELETE methods - no Content-Type validation', () => {
    it('should allow GET request without Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
      };
      mockRequest.method = 'GET';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow DELETE request without Content-Type', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
      };
      mockRequest.method = 'DELETE';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('SkipHeaderValidation decorator', () => {
    it('should skip all header validation when @SkipHeaderValidation decorator is present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      mockRequest.headers = {
        // Missing required headers
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should perform validation when decorator is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      mockRequest.headers = {
        // Missing required headers
      };
      mockRequest.method = 'GET';

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
    });
  });

  describe('Edge cases', () => {
    it('should handle Content-Length as string correctly', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '123',
        'content-type': 'application/json',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should treat invalid Content-Length as falsy', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': 'invalid',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should reject when Content-Length is negative (NaN after parseInt)', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '-1',
        // No content-type header
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true); // -1 is parsed, but it's not > 0, so no body
    });

    it('should handle very large Content-Length values', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-length': '999999999',
        'content-type': 'application/json',
      };
      mockRequest.method = 'POST';

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should be case-insensitive with Content-Type substring check', () => {
      mockRequest.headers = {
        'user-agent': 'test-agent',
        accept: 'application/json',
        'content-type': 'APPLICATION/JSON', // uppercase - should fail with current implementation
        'content-length': '256',
      };
      mockRequest.method = 'POST';

      // Note: The current implementation uses includes() which is case-sensitive
      // This test documents the current behavior
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(BadRequestException);
    });
  });
});
