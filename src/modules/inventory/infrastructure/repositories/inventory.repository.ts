import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IInventoryRepository } from '@modules/inventory/domain/repositories/inventory.repository.interface';
import { StockInRecord } from '@modules/inventory/domain/entities/stock-in-record.entity';
import { StockAlert } from '@modules/inventory/domain/entities/stock-alert.entity';
import {
  StockMovement,
  StockMovementType,
} from '@modules/inventory/domain/entities/stock-movement.entity';
import {
  StockInRecord as PrismaStockInRecord,
  StockAlert as PrismaStockAlert,
  Prisma,
} from '@prisma/client';

@Injectable()
export class InventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStockInRecord(record: Partial<StockInRecord>): Promise<StockInRecord> {
    const created = await this.prisma.stockInRecord.create({
      data: {
        productId: record.productId!,
        quantity: record.quantity!,
        costPrice:
          record.costPrice !== undefined && record.costPrice !== null ? record.costPrice : null,
        supplier: record.supplier || null,
        notes: record.notes || null,
        createdBy: record.createdBy!,
        recordMetadata: (record.recordMetadata as object) || {},
        createdAt: record.createdAt!,
      },
    });
    return this.toStockInRecordDomain(created);
  }

  async getStockInRecords(options?: {
    productId?: number;
    sellerId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StockInRecord[]; total: number }> {
    const where: Prisma.StockInRecordWhereInput = {};

    if (options?.productId) {
      where.productId = options.productId;
    }

    if (options?.sellerId) {
      where.product = {
        sellerId: options.sellerId,
      };
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [records, total] = await Promise.all([
      this.prisma.stockInRecord.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockInRecord.count({ where }),
    ]);

    return {
      items: records.map((r) => this.toStockInRecordDomain(r)),
      total,
    };
  }

  async getStockInRecordById(id: number): Promise<StockInRecord | null> {
    const record = await this.prisma.stockInRecord.findUnique({
      where: { id },
    });
    return record ? this.toStockInRecordDomain(record) : null;
  }

  async createStockAlert(alert: Partial<StockAlert>): Promise<StockAlert> {
    const created = await this.prisma.stockAlert.create({
      data: {
        productId: alert.productId!,
        userId: alert.userId!,
        alertType: alert.alertType!,
        message: alert.message!,
        isRead: alert.isRead ?? false,
        metadata: (alert.metadata as object) || {},
        createdAt: alert.createdAt!,
      },
    });
    return this.toStockAlertDomain(created);
  }

  async getStockAlerts(options?: {
    productId?: number;
    userId?: number;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StockAlert[]; total: number }> {
    const where: Prisma.StockAlertWhereInput = {};

    if (options?.productId) {
      where.productId = options.productId;
    }

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [alerts, total] = await Promise.all([
      this.prisma.stockAlert.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockAlert.count({ where }),
    ]);

    return {
      items: alerts.map((a) => this.toStockAlertDomain(a)),
      total,
    };
  }

  async markAlertAsRead(id: number): Promise<void> {
    await this.prisma.stockAlert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAlertsAsRead(userId: number): Promise<void> {
    await this.prisma.stockAlert.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createStockMovement(movement: Partial<StockMovement>): Promise<StockMovement> {
    const product = await this.prisma.product.findUnique({
      where: { id: movement.productId! },
      select: { inventoryInfo: true },
    });

    const inventoryInfo = (product?.inventoryInfo as Record<string, unknown>) || {};
    const movements = (inventoryInfo.movements as StockMovement[]) || [];
    movements.push({
      id: movements.length + 1,
      productId: movement.productId!,
      type: movement.type!,
      quantity: movement.quantity!,
      previousStock: movement.previousStock!,
      newStock: movement.newStock!,
      reason: movement.reason || null,
      referenceId: movement.referenceId || null,
      referenceType: movement.referenceType || null,
      createdBy: movement.createdBy!,
      metadata: movement.metadata || {},
      createdAt: movement.createdAt!,
    });

    await this.prisma.product.update({
      where: { id: movement.productId! },
      data: {
        inventoryInfo: {
          ...inventoryInfo,
          movements: movements.slice(-100),
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return movements[movements.length - 1];
  }

  async getStockMovements(options?: {
    productId?: number;
    type?: StockMovementType;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: StockMovement[]; total: number }> {
    if (!options?.productId) {
      return { items: [], total: 0 };
    }

    const product = await this.prisma.product.findUnique({
      where: { id: options.productId },
      select: { inventoryInfo: true },
    });

    if (!product) {
      return { items: [], total: 0 };
    }

    const inventoryInfo = (product.inventoryInfo as Record<string, unknown>) || {};
    let movements = ((inventoryInfo.movements as StockMovement[]) || []).reverse();

    if (options?.type) {
      movements = movements.filter((m) => m.type === options.type);
    }

    const total = movements.length;
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const items = movements.slice(skip, skip + pageSize);

    return { items, total };
  }

  async getLowStockProducts(
    sellerId: number,
  ): Promise<Array<{ id: number; title: string; stock: number; minStock: number }>> {
    const products = await this.prisma.product.findMany({
      where: {
        sellerId,
      },
      select: {
        id: true,
        title: true,
        stock: true,
        minStock: true,
      },
    });

    return products
      .filter((p) => p.stock <= p.minStock)
      .map((p) => ({
        id: p.id,
        title: p.title,
        stock: p.stock,
        minStock: p.minStock,
      }));
  }

  async updateProductStock(
    productId: number,
    quantity: number,
    reservedQuantity?: number,
  ): Promise<void> {
    const updateData: Prisma.ProductUpdateInput = {
      stock: quantity,
      updatedAt: BigInt(Date.now()),
    };

    if (reservedQuantity !== undefined) {
      updateData.reservedStock = reservedQuantity;
      updateData.availableStock = quantity - reservedQuantity;
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { reservedStock: true },
      });
      if (product) {
        updateData.availableStock = quantity - product.reservedStock;
      }
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  async getProductStock(productId: number): Promise<{
    stock: number;
    reservedStock: number;
    availableStock: number;
    minStock: number;
    maxStock: number | null;
  } | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        stock: true,
        reservedStock: true,
        availableStock: true,
        minStock: true,
        maxStock: true,
      },
    });

    if (!product) {
      return null;
    }

    return {
      stock: product.stock,
      reservedStock: product.reservedStock,
      availableStock: product.availableStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
    };
  }

  private toStockInRecordDomain(prismaRecord: PrismaStockInRecord): StockInRecord {
    return {
      id: prismaRecord.id,
      productId: prismaRecord.productId,
      quantity: prismaRecord.quantity,
      costPrice: prismaRecord.costPrice ? Number(prismaRecord.costPrice) : null,
      supplier: prismaRecord.supplier,
      notes: prismaRecord.notes,
      createdBy: prismaRecord.createdBy,
      recordMetadata: prismaRecord.recordMetadata as Record<string, unknown>,
      createdAt: prismaRecord.createdAt,
    };
  }

  private toStockAlertDomain(prismaAlert: PrismaStockAlert): StockAlert {
    return {
      id: prismaAlert.id,
      productId: prismaAlert.productId,
      userId: prismaAlert.userId,
      alertType: prismaAlert.alertType,
      message: prismaAlert.message,
      isRead: prismaAlert.isRead,
      metadata: prismaAlert.metadata as Record<string, unknown>,
      createdAt: prismaAlert.createdAt,
    };
  }
}
