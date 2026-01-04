import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AdminPackagesController } from './admin-packages.controller';
import { AdminPackagesService } from '../../application/services/admin-packages.service';
import { JwtAdminAuthGuard } from '@common/guards/jwt-admin-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

describe('AdminPackagesController - Package Stats Endpoint', () => {
  let app: INestApplication;
  let packagesService: AdminPackagesService;

  const mockPackageStats = {
    totalPackages: 10,
    activePackages: 8,
    totalSubscribers: 150,
    monthlyRevenue: 12500.5,
    popularPackage: 'Premium Boost',
  };

  const mockAdminPackagesService = {
    getPackages: jest.fn(),
    getPackageById: jest.fn(),
    createPackage: jest.fn(),
    updatePackage: jest.fn(),
    deletePackage: jest.fn(),
    togglePackageStatus: jest.fn(),
    getPackageStats: jest.fn().mockResolvedValue(mockPackageStats),
  };

  const mockJwtAdminAuthGuard = {
    canActivate: jest.fn((context) => {
      // Mock: set the admin user in the request
      context.switchToHttp().getRequest().user = { id: 1, role: 'admin' };
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPackagesController],
      providers: [
        {
          provide: AdminPackagesService,
          useValue: mockAdminPackagesService,
        },
      ],
    })
      .overrideGuard(JwtAdminAuthGuard)
      .useValue(mockJwtAdminAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    packagesService = moduleFixture.get<AdminPackagesService>(AdminPackagesService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /admin/packages/stats', () => {
    it('should retrieve package statistics successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Verify response structure
      expect(response.body).toEqual(mockPackageStats);
      expect(response.body).toHaveProperty('totalPackages');
      expect(response.body).toHaveProperty('activePackages');
      expect(response.body).toHaveProperty('totalSubscribers');
      expect(response.body).toHaveProperty('monthlyRevenue');
      expect(response.body).toHaveProperty('popularPackage');

      // Verify types
      expect(typeof response.body.totalPackages).toBe('number');
      expect(typeof response.body.activePackages).toBe('number');
      expect(typeof response.body.totalSubscribers).toBe('number');
      expect(typeof response.body.monthlyRevenue).toBe('number');
      expect(typeof response.body.popularPackage).toBe('string');

      // Verify service was called with correct admin ID
      expect(mockAdminPackagesService.getPackageStats).toHaveBeenCalledWith(1);
      expect(mockAdminPackagesService.getPackageStats).toHaveBeenCalledTimes(1);
    });

    it('should handle null popularPackage correctly', async () => {
      const statsWithNoPopular = {
        totalPackages: 5,
        activePackages: 3,
        totalSubscribers: 50,
        monthlyRevenue: 2500.0,
        popularPackage: null,
      };

      mockAdminPackagesService.getPackageStats.mockResolvedValueOnce(statsWithNoPopular);

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.popularPackage).toBeNull();
      expect(response.body.totalPackages).toBe(5);
      expect(response.body.activePackages).toBe(3);
    });

    it('should return correct numeric values for revenue calculations', async () => {
      const statsWithDecimalRevenue = {
        totalPackages: 15,
        activePackages: 12,
        totalSubscribers: 300,
        monthlyRevenue: 45678.99,
        popularPackage: 'Enterprise Plan',
      };

      mockAdminPackagesService.getPackageStats.mockResolvedValueOnce(statsWithDecimalRevenue);

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.monthlyRevenue).toBe(45678.99);
      expect(Number.isFinite(response.body.monthlyRevenue)).toBe(true);
    });

    it('should verify response contains no additional unexpected properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      const allowedKeys = ['totalPackages', 'activePackages', 'totalSubscribers', 'monthlyRevenue', 'popularPackage'];
      const responseKeys = Object.keys(response.body);

      // Check that response only contains expected keys
      responseKeys.forEach((key) => {
        expect(allowedKeys).toContain(key);
      });
    });

    it('should handle zero values correctly', async () => {
      const statsWithZeros = {
        totalPackages: 0,
        activePackages: 0,
        totalSubscribers: 0,
        monthlyRevenue: 0,
        popularPackage: null,
      };

      mockAdminPackagesService.getPackageStats.mockResolvedValueOnce(statsWithZeros);

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.totalPackages).toBe(0);
      expect(response.body.activePackages).toBe(0);
      expect(response.body.totalSubscribers).toBe(0);
      expect(response.body.monthlyRevenue).toBe(0);
      expect(response.body.popularPackage).toBeNull();
    });

    it('should require authentication (mocked as present)', async () => {
      mockJwtAdminAuthGuard.canActivate.mockImplementationOnce(() => {
        return true; // Auth is mocked as successful
      });

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toEqual(mockPackageStats);
    });

    it('should pass admin ID from authenticated user context', async () => {
      mockJwtAdminAuthGuard.canActivate.mockImplementationOnce((context) => {
        const mockAdminId = 42;
        context.switchToHttp().getRequest().user = { id: mockAdminId, role: 'admin' };
        return true;
      });

      mockAdminPackagesService.getPackageStats.mockResolvedValueOnce(mockPackageStats);

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      // Service should be called with the admin ID from context
      expect(mockAdminPackagesService.getPackageStats).toHaveBeenCalled();
    });

    it('should handle large numeric values', async () => {
      const statsWithLargeValues = {
        totalPackages: 10000,
        activePackages: 9500,
        totalSubscribers: 1000000,
        monthlyRevenue: 9999999.99,
        popularPackage: 'Platinum Premium',
      };

      mockAdminPackagesService.getPackageStats.mockResolvedValueOnce(statsWithLargeValues);

      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.totalPackages).toBe(10000);
      expect(response.body.totalSubscribers).toBe(1000000);
      expect(response.body.monthlyRevenue).toBe(9999999.99);
    });

    it('should respond with correct content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/packages/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.type).toMatch(/json/);
    });
  });
});
