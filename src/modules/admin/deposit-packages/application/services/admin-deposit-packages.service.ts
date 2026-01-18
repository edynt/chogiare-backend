import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../../common/database/prisma.service';
import { CreateDepositPackageDto, UpdateDepositPackageDto } from '../dto';
import { DepositPackage } from '@prisma/client';

@Injectable()
export class AdminDepositPackagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all deposit packages with pagination and filtering
   */
  async findAll(params: {
    page: number;
    limit: number;
    isActive?: boolean;
    sortBy: 'displayOrder' | 'amount' | 'name' | 'createdAt';
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, isActive, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where = isActive !== undefined ? { isActive } : {};

    const [packages, total] = await Promise.all([
      this.prisma.depositPackage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.depositPackage.count({ where }),
    ]);

    const items = packages.map((pkg: DepositPackage) => ({
      ...pkg,
      amount: Number(pkg.amount),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get a single deposit package by ID
   */
  async findOne(id: number) {
    const pkg = await this.prisma.depositPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      throw new NotFoundException(`Deposit package with ID ${id} not found`);
    }

    return {
      ...pkg,
      amount: Number(pkg.amount),
    };
  }

  /**
   * Create a new deposit package
   */
  async create(createDto: CreateDepositPackageDto) {
    // Check if name already exists
    const existingPackage = await this.prisma.depositPackage.findFirst({
      where: { name: createDto.name },
    });

    if (existingPackage) {
      throw new BadRequestException(`Deposit package with name "${createDto.name}" already exists`);
    }

    const now = BigInt(Date.now());
    const pkg = await this.prisma.depositPackage.create({
      data: {
        name: createDto.name.trim(),
        amount: createDto.amount,
        displayOrder: createDto.displayOrder ?? 0,
        isActive: createDto.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      ...pkg,
      amount: Number(pkg.amount),
    };
  }

  /**
   * Update an existing deposit package
   */
  async update(id: number, updateDto: UpdateDepositPackageDto) {
    // Check if package exists
    const existingPackage = await this.prisma.depositPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      throw new NotFoundException(`Deposit package with ID ${id} not found`);
    }

    // Check name uniqueness if name is being updated
    if (updateDto.name && updateDto.name !== existingPackage.name) {
      const duplicateName = await this.prisma.depositPackage.findFirst({
        where: { name: updateDto.name },
      });

      if (duplicateName) {
        throw new BadRequestException(
          `Deposit package with name "${updateDto.name}" already exists`,
        );
      }
    }

    const updateData: any = {
      updatedAt: BigInt(Date.now()),
    };
    if (updateDto.name !== undefined) updateData.name = updateDto.name.trim();
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.displayOrder !== undefined) updateData.displayOrder = updateDto.displayOrder;
    if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;

    const pkg = await this.prisma.depositPackage.update({
      where: { id },
      data: updateData,
    });

    return {
      ...pkg,
      amount: Number(pkg.amount),
    };
  }

  /**
   * Soft delete a deposit package (set isActive to false)
   */
  async remove(id: number) {
    // Check if package exists
    const existingPackage = await this.prisma.depositPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      throw new NotFoundException(`Deposit package with ID ${id} not found`);
    }

    await this.prisma.depositPackage.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: `Deposit package "${existingPackage.name}" has been deactivated successfully`,
    };
  }
}
