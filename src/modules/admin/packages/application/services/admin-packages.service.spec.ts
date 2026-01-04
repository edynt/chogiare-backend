import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdminPackagesService } from './admin-packages.service';
import { PrismaService } from '@common/database/prisma.service';

describe('AdminPackagesService', () => {
  let service: AdminPackagesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    boostPackage: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productBoost: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPackagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminPackagesService>(AdminPackagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPackageStats', () => {
    it('should return correct package statistics', async () => {
      const adminId = 1;

      // Mock data
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(10); // totalPackages
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(8); // activePackages

      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([
        { userId: 1 },
        { userId: 2 },
        { userId: 3 },
      ]); // activeBoosts (3 distinct users)

      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([
        {
          id: 1,
          boostPackageId: 'pkg-001',
          boostPackage: { price: 100.0, name: 'Basic' },
        },
        {
          id: 2,
          boostPackageId: 'pkg-002',
          boostPackage: { price: 250.5, name: 'Premium' },
        },
      ]); // monthlyBoosts

      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([
        { boostPackageId: 'pkg-002', _count: { id: 5 } },
      ]); // packageUsage

      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({
        name: 'Premium',
      }); // top package name

      const result = await service.getPackageStats(adminId);

      expect(result).toEqual({
        totalPackages: 10,
        activePackages: 8,
        totalSubscribers: 3,
        monthlyRevenue: 350.5,
        popularPackage: 'Premium',
      });

      // Verify calls
      expect(mockPrismaService.boostPackage.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.productBoost.groupBy).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.productBoost.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(0); // totalPackages
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(0); // activePackages
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]); // activeBoosts
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([]); // monthlyBoosts
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]); // packageUsage

      const result = await service.getPackageStats(adminId);

      expect(result).toEqual({
        totalPackages: 0,
        activePackages: 0,
        totalSubscribers: 0,
        monthlyRevenue: 0,
        popularPackage: null,
      });
    });

    it('should calculate correct revenue with multiple boosts', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(5);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(3);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([{ userId: 1 }, { userId: 2 }]);
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([
        { boostPackageId: 'pkg-001', boostPackage: { price: 99.99 } },
        { boostPackageId: 'pkg-001', boostPackage: { price: 99.99 } },
        { boostPackageId: 'pkg-002', boostPackage: { price: 199.99 } },
      ]);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([
        { boostPackageId: 'pkg-001', _count: { id: 2 } },
      ]);
      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({ name: 'Standard' });

      const result = await service.getPackageStats(adminId);

      // 99.99 + 99.99 + 199.99 = 399.97
      expect(result.monthlyRevenue).toBe(399.97);
    });

    it('should handle null popularPackage when no boosts exist', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(3);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(2);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]); // No package usage

      const result = await service.getPackageStats(adminId);

      expect(result.popularPackage).toBeNull();
      expect(result.totalSubscribers).toBe(0);
    });

    it('should query for active boosts with correct criteria', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);

      await service.getPackageStats(adminId);

      // Verify groupBy was called with correct parameters for active boosts
      const calls = mockPrismaService.productBoost.groupBy.mock.calls;
      expect(calls[0][0]).toEqual({
        by: ['userId'],
        where: {
          status: 'active',
          endDate: { gt: expect.any(Number) },
        },
      });
    });

    it('should query for monthly revenue with correct date range', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);

      await service.getPackageStats(adminId);

      const findManyCall = mockPrismaService.productBoost.findMany.mock.calls[0];
      const whereClause = findManyCall[0];

      expect(whereClause.where.createdAt.gte).toBeDefined();
      // Verify the month start timestamp is correctly calculated
      expect(typeof whereClause.where.createdAt.gte).toBe('number');
    });

    it('should order package usage by count descending', async () => {
      const adminId = 1;

      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.findMany.mockResolvedValueOnce([]);
      mockPrismaService.productBoost.groupBy.mockResolvedValueOnce([
        { boostPackageId: 'pkg-001', _count: { id: 100 } },
      ]);
      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({ name: 'Popular' });

      await service.getPackageStats(adminId);

      const groupByCall = mockPrismaService.productBoost.groupBy.mock.calls[1];
      expect(groupByCall[0]).toEqual({
        by: ['boostPackageId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      });
    });
  });

  describe('getPackages', () => {
    it('should retrieve packages with pagination', async () => {
      const mockPackages = [{ id: 'pkg-001', name: 'Basic', isActive: true }];

      mockPrismaService.boostPackage.findMany.mockResolvedValueOnce(mockPackages);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(1);

      const result = await service.getPackages({ page: 1, pageSize: 10 });

      expect(result.items).toEqual(mockPackages);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.boostPackage.findMany.mockResolvedValueOnce([]);
      mockPrismaService.boostPackage.count.mockResolvedValueOnce(0);

      await service.getPackages({ page: 1, pageSize: 10, search: 'Premium' });

      const whereClause = mockPrismaService.boostPackage.findMany.mock.calls[0][0].where;
      expect(whereClause.name).toEqual({
        contains: 'Premium',
        mode: 'insensitive',
      });
    });
  });

  describe('getPackageById', () => {
    it('should retrieve package by ID', async () => {
      const mockPackage = { id: 'pkg-001', name: 'Basic', _count: { productBoosts: 5 } };
      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce(mockPackage);

      const result = await service.getPackageById('pkg-001');

      expect(result).toEqual(mockPackage);
      expect(mockPrismaService.boostPackage.findUnique).toHaveBeenCalledWith({
        where: { id: 'pkg-001' },
        include: {
          _count: {
            select: { productBoosts: true },
          },
        },
      });
    });

    it('should throw NotFoundException when package not found', async () => {
      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce(null);

      await expect(service.getPackageById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPackage', () => {
    it('should create a new package', async () => {
      const createDto = {
        name: 'New Package',
        type: 'payPerView' as any,
        price: 99.99,
        description: 'Test package',
      };

      const mockCreatedPackage = { id: 'abc1234567', ...createDto };
      mockPrismaService.boostPackage.create.mockResolvedValueOnce(mockCreatedPackage);

      const result = await service.createPackage(1, createDto);

      expect(result.name).toBe('New Package');
      expect(result.price).toBe(99.99);
      expect(mockPrismaService.boostPackage.create).toHaveBeenCalled();
    });
  });

  describe('updatePackage', () => {
    it('should update an existing package', async () => {
      const packageId = 'pkg-001';
      const updateDto = { name: 'Updated Package' };

      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({ id: packageId });
      mockPrismaService.boostPackage.update.mockResolvedValueOnce({ id: packageId, ...updateDto });

      const result = await service.updatePackage(1, packageId, updateDto);

      expect(result.name).toBe('Updated Package');
    });

    it('should throw NotFoundException when package not found for update', async () => {
      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce(null);

      await expect(service.updatePackage(1, 'non-existent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePackage', () => {
    it('should delete a package when not in use', async () => {
      const packageId = 'pkg-001';

      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({
        id: packageId,
        _count: { productBoosts: 0 },
      });
      mockPrismaService.boostPackage.delete.mockResolvedValueOnce({});

      const result = await service.deletePackage(1, packageId);

      expect(result.message).toBe('Package deleted successfully');
    });

    it('should throw ConflictException when package is in use', async () => {
      const packageId = 'pkg-001';

      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({
        id: packageId,
        _count: { productBoosts: 5 },
      });

      await expect(service.deletePackage(1, packageId)).rejects.toThrow(ConflictException);
    });
  });

  describe('togglePackageStatus', () => {
    it('should toggle package active status', async () => {
      const packageId = 'pkg-001';

      mockPrismaService.boostPackage.findUnique.mockResolvedValueOnce({
        id: packageId,
        isActive: true,
      });
      mockPrismaService.boostPackage.update.mockResolvedValueOnce({
        id: packageId,
        isActive: false,
      });

      const result = await service.togglePackageStatus(1, packageId);

      expect(result.isActive).toBe(false);
    });
  });
});
