import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';
import { QueryPackageDto } from '../dto/query-package.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all packages with pagination and filtering
   */
  async getPackages(query: QueryPackageDto) {
    const { page = 1, pageSize = 10, search, type, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.boostPackage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.boostPackage.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get package by ID
   */
  async getPackageById(id: string) {
    const pkg = await this.prisma.boostPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productBoosts: true },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    return pkg;
  }

  /**
   * Create new package
   */
  async createPackage(adminId: number, dto: CreatePackageDto) {
    const id = uuidv4().substring(0, 10); // Short UUID for consistency with existing packages
    const now = Date.now();

    const pkg = await this.prisma.boostPackage.create({
      data: {
        id,
        name: dto.name,
        type: dto.type,
        price: dto.price,
        description: dto.description || null,
        config: dto.config || {},
        isActive: dto.isActive ?? true,
        metadata: dto.metadata || {},
        createdAt: now,
        updatedAt: now,
      },
    });

    return pkg;
  }

  /**
   * Update package
   */
  async updatePackage(adminId: number, id: string, dto: UpdatePackageDto) {
    const existing = await this.prisma.boostPackage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    const now = Date.now();

    const updated = await this.prisma.boostPackage.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.type && { type: dto.type }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.config && { config: dto.config }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.metadata && { metadata: dto.metadata }),
        updatedAt: now,
      },
    });

    return updated;
  }

  /**
   * Delete package
   */
  async deletePackage(adminId: number, id: string) {
    const existing = await this.prisma.boostPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productBoosts: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    // Check if package is in use
    if (existing._count.productBoosts > 0) {
      throw new ConflictException(
        `Cannot delete package. It is currently used by ${existing._count.productBoosts} boost(s). Deactivate it instead.`,
      );
    }

    await this.prisma.boostPackage.delete({
      where: { id },
    });

    return { message: 'Package deleted successfully' };
  }

  /**
   * Toggle package active status
   */
  async togglePackageStatus(adminId: number, id: string) {
    const existing = await this.prisma.boostPackage.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID ${id} not found`);
    }

    const now = Date.now();

    const updated = await this.prisma.boostPackage.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
        updatedAt: now,
      },
    });

    return updated;
  }
}
