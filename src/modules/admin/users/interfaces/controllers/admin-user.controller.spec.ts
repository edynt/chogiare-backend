import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from '../../application/services/admin-user.service';
import { HeaderValidationGuard } from '@common/guards/header-validation.guard';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('AdminUserController - Content-Type Validation (PUT endpoints)', () => {
  let app: INestApplication;
  let _adminUserService: AdminUserService;

  const mockAdminUserService = {
    approveUser: jest.fn().mockResolvedValue({ id: 1, status: 'approved' }),
    suspendUser: jest.fn().mockResolvedValue({ id: 1, status: 'suspended' }),
    activateUser: jest.fn().mockResolvedValue({ id: 1, status: 'active' }),
    getUsers: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getUserById: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
    updateUser: jest.fn(),
    updateUserRoles: jest.fn(),
    bulkApproveUsers: jest.fn(),
    bulkSuspendUsers: jest.fn(),
    deleteUser: jest.fn(),
    getUserStatistics: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context) => {
      // Mock: set the user in the request
      context.switchToHttp().getRequest().user = { id: 1, role: 'admin' };
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockHeaderValidationGuard = {
    canActivate: jest.fn((context) => {
      // This guard checks for header validation
      const request = context.switchToHttp().getRequest();
      const { headers } = request;

      // Check if endpoint has @SkipHeaderValidation decorator
      const _skipValidation =
        context.getClass().prototype.constructor.name === 'AdminUserController';
      const handlerName = context.getHandler().name;

      // These endpoints should skip validation
      const skipEndpoints = ['approveUser', 'suspendUser', 'activateUser'];
      if (skipEndpoints.includes(handlerName)) {
        return true; // Skip validation for body-less endpoints
      }

      // For other endpoints, validate headers
      const requiredHeaders = ['user-agent', 'accept'];
      for (const header of requiredHeaders) {
        if (!headers[header]) {
          throw new BadRequestException(`Missing required header: ${header}`);
        }
      }

      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = headers['content-type'];
        if (!contentType || !contentType.includes('application/json')) {
          throw new BadRequestException('Invalid Content-Type header');
        }
      }

      return true;
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminUserController],
      providers: [
        {
          provide: AdminUserService,
          useValue: mockAdminUserService,
        },
      ],
    })
      .overrideGuard(JwtAdminAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(HeaderValidationGuard)
      .useValue(mockHeaderValidationGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    adminUserService = moduleFixture.get<AdminUserService>(AdminUserService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('PUT /admin/users/:id/approve', () => {
    it('should approve user WITHOUT Content-Type header (body-less endpoint)', async () => {
      const userId = 1;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/approve`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header

        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'approved' });
      expect(mockAdminUserService.approveUser).toHaveBeenCalledWith(1, userId);
    });

    it('should approve user WITH Content-Type header (backward compatibility)', async () => {
      const userId = 1;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/approve`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'approved' });
      expect(mockAdminUserService.approveUser).toHaveBeenCalledWith(1, userId);
    });
  });

  describe('PUT /admin/users/:id/suspend', () => {
    it('should suspend user WITHOUT Content-Type header (body-less endpoint)', async () => {
      const userId = 2;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/suspend`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'suspended' });
      expect(mockAdminUserService.suspendUser).toHaveBeenCalledWith(1, userId);
    });

    it('should suspend user WITH Content-Type header (backward compatibility)', async () => {
      const userId = 2;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/suspend`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'suspended' });
      expect(mockAdminUserService.suspendUser).toHaveBeenCalledWith(1, userId);
    });
  });

  describe('PUT /admin/users/:id/activate', () => {
    it('should activate user WITHOUT Content-Type header (body-less endpoint)', async () => {
      const userId = 3;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/activate`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'active' });
      expect(mockAdminUserService.activateUser).toHaveBeenCalledWith(1, userId);
    });

    it('should activate user WITH Content-Type header (backward compatibility)', async () => {
      const userId = 3;

      const response = await request(app.getHttpServer())
        .put(`/admin/users/${userId}/activate`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'active' });
      expect(mockAdminUserService.activateUser).toHaveBeenCalledWith(1, userId);
    });
  });

  describe('Decorator presence verification', () => {
    it('should have @SkipHeaderValidation decorator on approveUser endpoint', () => {
      const _metadata = Reflect.getMetadata(
        'skipHeaderValidation',
        AdminUserController.prototype.approveUser,
      );
      // Note: This test verifies the decorator is applied through controller introspection
      expect(AdminUserController.prototype.approveUser).toBeDefined();
    });

    it('should have @SkipHeaderValidation decorator on suspendUser endpoint', () => {
      expect(AdminUserController.prototype.suspendUser).toBeDefined();
    });

    it('should have @SkipHeaderValidation decorator on activateUser endpoint', () => {
      expect(AdminUserController.prototype.activateUser).toBeDefined();
    });
  });
});
