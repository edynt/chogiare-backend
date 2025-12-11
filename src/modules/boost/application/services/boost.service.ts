import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { PaymentService } from '@modules/payment/application/services/payment.service';
import { CreateBoostDto } from '../dto/create-boost.dto';

@Injectable()
export class BoostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createBoost(userId: number, createBoostDto: CreateBoostDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createBoostDto.productId },
    });

    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new BadRequestException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED_ACCESS,
      });
    }

    const boostPackage = await this.prisma.boostPackage.findUnique({
      where: { id: createBoostDto.boostPackageId },
    });

    if (!boostPackage) {
      throw new NotFoundException({
        message: MESSAGES.BOOST.PACKAGE_NOT_FOUND,
        errorCode: ERROR_CODES.BOOST_PACKAGE_NOT_FOUND,
      });
    }

    if (!boostPackage.isActive) {
      throw new BadRequestException({
        message: MESSAGES.BOOST.PACKAGE_NOT_ACTIVE,
        errorCode: ERROR_CODES.BOOST_PACKAGE_NOT_ACTIVE,
      });
    }

    let totalCost = Number(boostPackage.price);
    const config = boostPackage.config as Record<string, unknown>;

    if (createBoostDto.days && boostPackage.type === 'payPerDay') {
      totalCost = Number(boostPackage.price) * createBoostDto.days;
    } else if (createBoostDto.viewsTarget && boostPackage.type === 'payPerView') {
      const pricePerView = config.pricePerView as number;
      if (pricePerView) {
        totalCost = pricePerView * createBoostDto.viewsTarget;
      }
    }

    const now = BigInt(Date.now());
    let endDate: bigint | null = null;

    if (createBoostDto.days) {
      endDate = BigInt(Number(now) + createBoostDto.days * 24 * 60 * 60 * 1000);
    }

    const boost = await this.prisma.productBoost.create({
      data: {
        productId: createBoostDto.productId,
        boostPackageId: createBoostDto.boostPackageId,
        userId,
        status: 'active',
        viewsTarget: createBoostDto.viewsTarget || null,
        viewsActual: 0,
        days: createBoostDto.days || null,
        startDate: now,
        endDate,
        totalCost,
        boostMetadata: {},
        createdAt: now,
        updatedAt: now,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        boostPackage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    await this.paymentService.useBalanceForBoost(
      userId,
      totalCost,
      boost.id,
      `Boost product: ${product.title} - Package: ${boostPackage.name}`,
    );

    return {
      id: boost.id,
      product: boost.product,
      boostPackage: boost.boostPackage,
      totalCost: Number(boost.totalCost),
      status: boost.status,
      startDate: boost.startDate.toString(),
      endDate: boost.endDate?.toString() || null,
      viewsTarget: boost.viewsTarget,
      days: boost.days,
    };
  }

  async getBoostPackages() {
    const packages = await this.prisma.boostPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      price: Number(pkg.price),
      description: pkg.description,
      config: pkg.config,
    }));
  }

  async getUserBoosts(userId: number) {
    const boosts = await this.prisma.productBoost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
          },
        },
        boostPackage: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return boosts.map((boost) => ({
      id: boost.id,
      product: boost.product,
      boostPackage: boost.boostPackage,
      status: boost.status,
      totalCost: Number(boost.totalCost),
      viewsTarget: boost.viewsTarget,
      viewsActual: boost.viewsActual,
      days: boost.days,
      startDate: boost.startDate.toString(),
      endDate: boost.endDate?.toString() || null,
      createdAt: boost.createdAt.toString(),
    }));
  }
}
