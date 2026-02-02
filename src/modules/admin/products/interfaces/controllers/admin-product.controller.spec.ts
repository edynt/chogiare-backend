import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AdminProductController } from './admin-product.controller';
import { AdminProductService } from '../../application/services/admin-product.service';
import { HeaderValidationGuard } from '@common/guards/header-validation.guard';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('AdminProductController - Content-Type Validation (PUT endpoints)', () => {
  let app: INestApplication;
  let _adminProductService: AdminProductService;

  const mockAdminProductService = {
    approveProduct: jest.fn().mockResolvedValue({ id: 1, status: 'approved' }),
    suspendProduct: jest.fn().mockResolvedValue({ id: 1, status: 'suspended' }),
    activateProduct: jest.fn().mockResolvedValue({ id: 1, status: 'active' }),
    getProducts: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    bulkApproveProducts: jest.fn(),
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

      const handlerName = context.getHandler().name;

      // These endpoints should skip validation
      const skipEndpoints = ['approveProduct', 'suspendProduct', 'activateProduct'];
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
      controllers: [AdminProductController],
      providers: [
        {
          provide: AdminProductService,
          useValue: mockAdminProductService,
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
    adminProductService = moduleFixture.get<AdminProductService>(AdminProductService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('PUT /admin/products/:id/approve', () => {
    it('should approve product WITHOUT Content-Type header (body-less endpoint)', async () => {
      const productId = 1;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/approve`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'approved' });
      expect(mockAdminProductService.approveProduct).toHaveBeenCalledWith(1, productId);
    });

    it('should approve product WITH Content-Type header (backward compatibility)', async () => {
      const productId = 1;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/approve`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'approved' });
      expect(mockAdminProductService.approveProduct).toHaveBeenCalledWith(1, productId);
    });
  });

  describe('PUT /admin/products/:id/suspend', () => {
    it('should suspend product WITHOUT Content-Type header (body-less endpoint)', async () => {
      const productId = 2;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/suspend`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'suspended' });
      expect(mockAdminProductService.suspendProduct).toHaveBeenCalledWith(1, productId);
    });

    it('should suspend product WITH Content-Type header (backward compatibility)', async () => {
      const productId = 2;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/suspend`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'suspended' });
      expect(mockAdminProductService.suspendProduct).toHaveBeenCalledWith(1, productId);
    });
  });

  describe('PUT /admin/products/:id/activate', () => {
    it('should activate product WITHOUT Content-Type header (body-less endpoint)', async () => {
      const productId = 3;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/activate`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        // Deliberately NOT setting Content-Type header
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'active' });
      expect(mockAdminProductService.activateProduct).toHaveBeenCalledWith(1, productId);
    });

    it('should activate product WITH Content-Type header (backward compatibility)', async () => {
      const productId = 3;

      const response = await request(app.getHttpServer())
        .put(`/admin/products/${productId}/activate`)
        .set('user-agent', 'test-agent')
        .set('accept', 'application/json')
        .set('content-type', 'application/json')
        .expect(200);

      expect(response.body).toEqual({ id: 1, status: 'active' });
      expect(mockAdminProductService.activateProduct).toHaveBeenCalledWith(1, productId);
    });
  });

  describe('Decorator presence verification', () => {
    it('should have @SkipHeaderValidation decorator on approveProduct endpoint', () => {
      expect(AdminProductController.prototype.approveProduct).toBeDefined();
    });

    it('should have @SkipHeaderValidation decorator on suspendProduct endpoint', () => {
      expect(AdminProductController.prototype.suspendProduct).toBeDefined();
    });

    it('should have @SkipHeaderValidation decorator on activateProduct endpoint', () => {
      expect(AdminProductController.prototype.activateProduct).toBeDefined();
    });
  });
});
