import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../common/database/prisma.service';
import { CreatePackageDto, UpdatePackageDto } from '../dto';
import { ServicePackage } from '@prisma/client';

@Injectable()
export class AdminPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all service packages with pagination
   */
  async findAll(params: {
    page: number;
    pageSize: number;
    isActive?: boolean;
    sortBy: 'displayOrder' | 'price' | 'durationDays';
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, pageSize, isActive, sortBy, sortOrder } = params;
    const skip = (page - 1) * pageSize;

    const where = isActive !== undefined ? { isActive } : {};

    const [packages, total] = await Promise.all([
      this.prisma.servicePackage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.servicePackage.count({ where }),
    ]);

    // Get purchase counts for each package
    const packageIds = packages.map((pkg) => pkg.id);
    const purchaseCounts = await this.prisma.subscriptionPurchase.groupBy({
      by: ['packageId'],
      where: {
        packageId: { in: packageIds },
      },
      _count: {
        id: true,
      },
    });

    const purchaseCountMap = new Map(
      purchaseCounts.map((item: { packageId: number; _count: { id: number } }) => [
        item.packageId,
        item._count.id,
      ]),
    );

    const items = packages.map((pkg: ServicePackage) => ({
      ...pkg,
      price: Number(pkg.price),
      features:
        typeof pkg.features === 'string' ? JSON.parse(pkg.features as string) : pkg.features,
      metadata:
        typeof pkg.metadata === 'string' ? JSON.parse(pkg.metadata as string) : pkg.metadata,
      purchaseCount: purchaseCountMap.get(pkg.id) || 0,
    }));

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Get a single package by ID
   */
  async findOne(id: number) {
    const pkg = await this.prisma.servicePackage.findUnique({
      where: { id },
      include: {
        purchases: {
          take: 10,
          orderBy: { purchasedAt: 'desc' },
          include: {
            subscription: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return {
      ...pkg,
      price: Number(pkg.price),
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      metadata: typeof pkg.metadata === 'string' ? JSON.parse(pkg.metadata) : pkg.metadata,
      purchases: pkg.purchases.map((purchase) => ({
        ...purchase,
        pricePaid: Number(purchase.pricePaid),
      })),
    };
  }

  /**
   * Create a new service package
   */
  async create(dto: CreatePackageDto) {
    // Validate unique name
    const existing = await this.prisma.servicePackage.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Package with name "${dto.name}" already exists`);
    }

    const now = Date.now();

    const pkg = await this.prisma.servicePackage.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        durationDays: dto.durationDays,
        price: dto.price,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
        features: dto.features ? JSON.stringify(dto.features) : JSON.stringify([]),
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : JSON.stringify({}),
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      ...pkg,
      price: Number(pkg.price),
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      metadata: typeof pkg.metadata === 'string' ? JSON.parse(pkg.metadata) : pkg.metadata,
    };
  }

  /**
   * Update an existing package
   */
  async update(id: number, dto: UpdatePackageDto) {
    // Check if package exists
    const existing = await this.prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    // If name is being updated, check uniqueness
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.servicePackage.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new BadRequestException(`Package with name "${dto.name}" already exists`);
      }
    }

    const now = Date.now();

    const pkg = await this.prisma.servicePackage.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.durationDays && { durationDays: dto.durationDays }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
        ...(dto.features && { features: JSON.stringify(dto.features) }),
        ...(dto.metadata && { metadata: JSON.stringify(dto.metadata) }),
        updatedAt: now,
      },
    });

    return {
      ...pkg,
      price: Number(pkg.price),
      features: typeof pkg.features === 'string' ? JSON.parse(pkg.features) : pkg.features,
      metadata: typeof pkg.metadata === 'string' ? JSON.parse(pkg.metadata) : pkg.metadata,
    };
  }

  /**
   * Delete a package (soft delete by setting isActive = false)
   */
  async remove(id: number) {
    // Check if package exists
    const existing = await this.prisma.servicePackage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    // Check if package has active subscriptions
    const activeSubscriptions = await this.prisma.subscriptionPurchase.count({
      where: {
        packageId: id,
        subscription: {
          isActive: true,
        },
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete package with ${activeSubscriptions} active subscriptions. Please deactivate instead.`,
      );
    }

    // Soft delete by setting isActive = false
    const now = Date.now();
    await this.prisma.servicePackage.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: now,
      },
    });

    return {
      success: true,
      message: `Package ${existing.displayName} has been deactivated`,
    };
  }

  /**
   * Get package statistics
   */
  async getStatistics() {
    const [totalPackages, activePackages, totalPurchases, activeSubs] = await Promise.all([
      this.prisma.servicePackage.count(),
      this.prisma.servicePackage.count({ where: { isActive: true } }),
      this.prisma.subscriptionPurchase.count(),
      this.prisma.userSubscription.count({ where: { isActive: true } }),
    ]);

    // Get revenue by package
    const revenueByPackage = await this.prisma.subscriptionPurchase.groupBy({
      by: ['packageId'],
      _sum: {
        pricePaid: true,
      },
      _count: {
        id: true,
      },
    });

    // Get package details
    const packages = await this.prisma.servicePackage.findMany({
      select: {
        id: true,
        displayName: true,
        price: true,
      },
    });

    const packageMap = new Map(
      packages.map((p) => [p.id, p]),
    );

    const revenueStats = revenueByPackage.map((item) => ({
      packageId: item.packageId,
      packageName: packageMap.get(item.packageId)?.displayName || 'Unknown',
      totalRevenue: Number(item._sum?.pricePaid || 0),
      totalPurchases: item._count.id,
    }));

    // Calculate total revenue
    const totalRevenue = revenueStats.reduce((sum, item) => sum + item.totalRevenue, 0);

    return {
      totalPackages,
      activePackages,
      totalPurchases,
      totalRevenue,
      activeSubscriptions: activeSubs,
      revenueByPackage: revenueStats,
    };
  }
}
