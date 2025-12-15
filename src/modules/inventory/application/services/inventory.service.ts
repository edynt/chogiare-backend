import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '@modules/inventory/domain/repositories/inventory.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { StockInDto } from '../dto/stock-in.dto';
import { StockOutDto } from '../dto/stock-out.dto';
import { StockAdjustmentDto } from '../dto/stock-adjustment.dto';
import { QueryStockInDto, QueryStockAlertDto, QueryStockMovementDto } from '../dto/query-stock.dto';
import { StockMovementType } from '@modules/inventory/domain/entities/stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async stockIn(userId: number, stockInDto: StockInDto) {
    const product = await this.productRepository.findById(stockInDto.productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
      });
    }

    const currentStock = await this.inventoryRepository.getProductStock(stockInDto.productId);
    if (!currentStock) {
      throw new NotFoundException({
        message: MESSAGES.INVENTORY.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.INVENTORY_PRODUCT_NOT_FOUND,
      });
    }

    const newStock = currentStock.stock + stockInDto.quantity;
    if (currentStock.maxStock && newStock > currentStock.maxStock) {
      throw new BadRequestException({
        message: MESSAGES.INVENTORY.EXCEEDS_MAX_STOCK,
        errorCode: ERROR_CODES.INVENTORY_EXCEEDS_MAX_STOCK,
      });
    }

    const now = BigInt(Date.now());

    await this.prisma.$transaction(async () => {
      await this.inventoryRepository.createStockInRecord({
        productId: stockInDto.productId,
        quantity: stockInDto.quantity,
        costPrice: stockInDto.costPrice || null,
        supplier: stockInDto.supplier || null,
        notes: stockInDto.notes || null,
        createdBy: userId,
        recordMetadata: {},
        createdAt: now,
      });

      await this.inventoryRepository.updateProductStock(
        stockInDto.productId,
        newStock,
        currentStock.reservedStock,
      );

      await this.inventoryRepository.createStockMovement({
        productId: stockInDto.productId,
        type: StockMovementType.STOCK_IN,
        quantity: stockInDto.quantity,
        previousStock: currentStock.stock,
        newStock,
        reason: stockInDto.notes || 'Stock in',
        referenceId: null,
        referenceType: null,
        createdBy: userId,
        metadata: {
          supplier: stockInDto.supplier,
          costPrice: stockInDto.costPrice,
        },
        createdAt: now,
      });
    });

    await this.checkAndCreateLowStockAlert(stockInDto.productId, newStock, product.minStock);

    return {
      message: MESSAGES.INVENTORY.STOCK_IN_SUCCESS,
      data: {
        productId: stockInDto.productId,
        quantity: stockInDto.quantity,
        newStock,
      },
    };
  }

  async stockOut(userId: number, stockOutDto: StockOutDto) {
    const product = await this.productRepository.findById(stockOutDto.productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
      });
    }

    const currentStock = await this.inventoryRepository.getProductStock(stockOutDto.productId);
    if (!currentStock) {
      throw new NotFoundException({
        message: MESSAGES.INVENTORY.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.INVENTORY_PRODUCT_NOT_FOUND,
      });
    }

    if (currentStock.availableStock < stockOutDto.quantity) {
      throw new BadRequestException({
        message: MESSAGES.INVENTORY.INSUFFICIENT_STOCK,
        errorCode: ERROR_CODES.INVENTORY_INSUFFICIENT_STOCK,
      });
    }

    const newStock = currentStock.stock - stockOutDto.quantity;
    const newReservedStock = Math.max(0, currentStock.reservedStock - stockOutDto.quantity);
    const newAvailableStock = newStock - newReservedStock;

    const now = BigInt(Date.now());

    await this.prisma.$transaction(async () => {
      await this.inventoryRepository.updateProductStock(
        stockOutDto.productId,
        newStock,
        newReservedStock,
      );

      await this.inventoryRepository.createStockMovement({
        productId: stockOutDto.productId,
        type: StockMovementType.STOCK_OUT,
        quantity: stockOutDto.quantity,
        previousStock: currentStock.stock,
        newStock,
        reason: stockOutDto.reason || 'Stock out',
        referenceId: stockOutDto.referenceId || null,
        referenceType: stockOutDto.referenceType || null,
        createdBy: userId,
        metadata: {},
        createdAt: now,
      });
    });

    await this.checkAndCreateLowStockAlert(stockOutDto.productId, newStock, product.minStock);

    return {
      message: MESSAGES.INVENTORY.STOCK_OUT_SUCCESS,
      data: {
        productId: stockOutDto.productId,
        quantity: stockOutDto.quantity,
        newStock,
        newAvailableStock,
      },
    };
  }

  async stockAdjustment(userId: number, adjustmentDto: StockAdjustmentDto) {
    const product = await this.productRepository.findById(adjustmentDto.productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
      });
    }

    const currentStock = await this.inventoryRepository.getProductStock(adjustmentDto.productId);
    if (!currentStock) {
      throw new NotFoundException({
        message: MESSAGES.INVENTORY.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.INVENTORY_PRODUCT_NOT_FOUND,
      });
    }

    if (adjustmentDto.newStock < 0) {
      throw new BadRequestException({
        message: MESSAGES.INVENTORY.INVALID_STOCK,
        errorCode: ERROR_CODES.INVENTORY_INVALID_STOCK,
      });
    }

    if (currentStock.maxStock && adjustmentDto.newStock > currentStock.maxStock) {
      throw new BadRequestException({
        message: MESSAGES.INVENTORY.EXCEEDS_MAX_STOCK,
        errorCode: ERROR_CODES.INVENTORY_EXCEEDS_MAX_STOCK,
      });
    }

    const difference = adjustmentDto.newStock - currentStock.stock;
    const newReservedStock = Math.min(currentStock.reservedStock, adjustmentDto.newStock);
    const newAvailableStock = adjustmentDto.newStock - newReservedStock;

    const now = BigInt(Date.now());

    await this.prisma.$transaction(async () => {
      await this.inventoryRepository.updateProductStock(
        adjustmentDto.productId,
        adjustmentDto.newStock,
        newReservedStock,
      );

      await this.inventoryRepository.createStockMovement({
        productId: adjustmentDto.productId,
        type: StockMovementType.STOCK_ADJUSTMENT,
        quantity: Math.abs(difference),
        previousStock: currentStock.stock,
        newStock: adjustmentDto.newStock,
        reason: adjustmentDto.reason || 'Stock adjustment',
        referenceId: null,
        referenceType: null,
        createdBy: userId,
        metadata: {},
        createdAt: now,
      });
    });

    await this.checkAndCreateLowStockAlert(
      adjustmentDto.productId,
      adjustmentDto.newStock,
      product.minStock,
    );

    return {
      message: MESSAGES.INVENTORY.STOCK_ADJUSTMENT_SUCCESS,
      data: {
        productId: adjustmentDto.productId,
        previousStock: currentStock.stock,
        newStock: adjustmentDto.newStock,
        difference,
        newAvailableStock,
      },
    };
  }

  async getStockInRecords(userId: number, queryDto: QueryStockInDto) {
    const products = await this.productRepository.findAll({
      sellerId: userId,
      page: 1,
      pageSize: 10000,
    });

    const productIds = products.items.map((p) => p.id);
    if (queryDto.productId && !productIds.includes(queryDto.productId)) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
      });
    }

    const result = await this.inventoryRepository.getStockInRecords({
      productId: queryDto.productId,
      sellerId: userId,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    });

    return {
      message: MESSAGES.INVENTORY.STOCK_IN_RECORDS_RETRIEVED,
      data: result,
    };
  }

  async getStockAlerts(userId: number, queryDto: QueryStockAlertDto) {
    const result = await this.inventoryRepository.getStockAlerts({
      productId: queryDto.productId,
      userId,
      isRead: queryDto.isRead,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    });

    return {
      message: MESSAGES.INVENTORY.STOCK_ALERTS_RETRIEVED,
      data: result,
    };
  }

  async markAlertAsRead(userId: number, alertId: number) {
    const alert = await this.inventoryRepository.getStockAlerts({
      userId,
      page: 1,
      pageSize: 1,
    });

    const foundAlert = alert.items.find((a) => a.id === alertId);
    if (!foundAlert) {
      throw new NotFoundException({
        message: MESSAGES.INVENTORY.ALERT_NOT_FOUND,
        errorCode: ERROR_CODES.INVENTORY_ALERT_NOT_FOUND,
      });
    }

    await this.inventoryRepository.markAlertAsRead(alertId);

    return {
      message: MESSAGES.INVENTORY.ALERT_MARKED_AS_READ,
      data: { alertId },
    };
  }

  async markAllAlertsAsRead(userId: number) {
    await this.inventoryRepository.markAllAlertsAsRead(userId);

    return {
      message: MESSAGES.INVENTORY.ALL_ALERTS_MARKED_AS_READ,
      data: { userId },
    };
  }

  async getStockMovements(userId: number, queryDto: QueryStockMovementDto) {
    if (queryDto.productId) {
      const product = await this.productRepository.findById(queryDto.productId);
      if (!product) {
        throw new NotFoundException({
          message: MESSAGES.PRODUCT.NOT_FOUND,
          errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
        });
      }

      if (product.sellerId !== userId) {
        throw new UnauthorizedException({
          message: MESSAGES.PRODUCT.UNAUTHORIZED,
          errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
        });
      }
    }

    const result = await this.inventoryRepository.getStockMovements({
      productId: queryDto.productId,
      type: queryDto.type,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
    });

    return {
      message: MESSAGES.INVENTORY.STOCK_MOVEMENTS_RETRIEVED,
      data: result,
    };
  }

  async getLowStockProducts(userId: number) {
    const lowStockProducts = await this.inventoryRepository.getLowStockProducts(userId);

    return {
      message: MESSAGES.INVENTORY.LOW_STOCK_PRODUCTS_RETRIEVED,
      data: lowStockProducts,
    };
  }

  async getProductStock(userId: number, productId: number) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: MESSAGES.PRODUCT.NOT_FOUND,
        errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
      });
    }

    if (product.sellerId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.PRODUCT.UNAUTHORIZED,
        errorCode: ERROR_CODES.PRODUCT_UNAUTHORIZED,
      });
    }

    const stock = await this.inventoryRepository.getProductStock(productId);
    if (!stock) {
      throw new NotFoundException({
        message: MESSAGES.INVENTORY.PRODUCT_NOT_FOUND,
        errorCode: ERROR_CODES.INVENTORY_PRODUCT_NOT_FOUND,
      });
    }

    return {
      message: MESSAGES.INVENTORY.STOCK_RETRIEVED,
      data: stock,
    };
  }

  async getInventoryReports(userId: number, type?: string, dateFrom?: string, dateTo?: string) {
    const products = await this.productRepository.findAll({
      sellerId: userId,
      page: 1,
      pageSize: 10000,
    });

    const productIds = products.items.map((p) => p.id);

    const startDate = dateFrom ? new Date(dateFrom) : new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const [stockInRecords, stockMovements, lowStockProducts] = await Promise.all([
      this.inventoryRepository.getStockInRecords({
        sellerId: userId,
        page: 1,
        pageSize: 10000,
      }),
      this.inventoryRepository.getStockMovements({
        page: 1,
        pageSize: 10000,
      }),
      this.inventoryRepository.getLowStockProducts(userId),
    ]);

    const uniqueCategoryIds = [...new Set(products.items.map((p) => p.categoryId))];
    const categories = await Promise.all(
      uniqueCategoryIds.map((id) => this.categoryRepository.findById(id)),
    );
    const categoryMap = new Map<number, string>();
    categories.forEach((category) => {
      if (category) {
        categoryMap.set(category.id, category.name);
      }
    });

    const inventoryData = products.items.map((product) => {
      const productStockInRecords = stockInRecords.items.filter(
        (record) => record.productId === product.id,
      );
      const productMovements = stockMovements.items.filter(
        (movement) => movement.productId === product.id,
      );

      const totalCost = productStockInRecords.reduce(
        (sum, record) => sum + (record.costPrice || 0) * record.quantity,
        0,
      );
      const totalQuantity = productStockInRecords.reduce((sum, record) => sum + record.quantity, 0);
      const avgCostPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      return {
        id: product.id.toString(),
        name: product.title,
        sku: product.sku || `SKU-${product.id}`,
        category: categoryMap.get(product.categoryId) || 'Khác',
        currentStock: product.stock || 0,
        minStock: product.minStock || 0,
        maxStock: product.maxStock || null,
        costPrice: avgCostPrice,
        sellingPrice: product.price,
        profit: product.price - avgCostPrice,
        profitMargin:
          product.price > 0 ? ((product.price - avgCostPrice) / product.price) * 100 : 0,
        status:
          (product.stock || 0) <= (product.minStock || 0)
            ? 'low_stock'
            : (product.stock || 0) === 0
              ? 'out_of_stock'
              : 'in_stock',
        lastUpdated: new Date(Number(product.updatedAt)).toISOString(),
        supplier: productStockInRecords[0]?.supplier || 'N/A',
        location: 'Kho chính',
      };
    });

    const reports = [
      {
        id: '1',
        name: `Báo cáo tồn kho ${new Date().toLocaleDateString('vi-VN')}`,
        type: 'inventory',
        generatedAt: new Date().toISOString(),
        fileSize: '2.5 MB',
        status: 'ready',
      },
    ];

    return {
      message: 'Inventory reports retrieved successfully',
      data: {
        reports,
        inventoryData: type === 'inventory' ? inventoryData : [],
        lowStockProducts: type === 'low_stock' ? lowStockProducts : [],
        stockMovements: type === 'stock_movement' ? stockMovements.items : [],
      },
    };
  }

  private async checkAndCreateLowStockAlert(
    productId: number,
    currentStock: number,
    minStock: number,
  ): Promise<void> {
    if (currentStock <= minStock) {
      const product = await this.productRepository.findById(productId);
      if (!product) return;

      const existingAlerts = await this.inventoryRepository.getStockAlerts({
        productId,
        userId: product.sellerId,
        isRead: false,
        page: 1,
        pageSize: 1,
      });

      const hasUnreadAlert = existingAlerts.items.some(
        (alert) => alert.alertType === 'low_stock' && !alert.isRead,
      );

      if (!hasUnreadAlert) {
        await this.inventoryRepository.createStockAlert({
          productId,
          userId: product.sellerId,
          alertType: 'low_stock',
          message: `Product "${product.title}" is running low on stock. Current stock: ${currentStock}, Minimum stock: ${minStock}`,
          isRead: false,
          metadata: {
            currentStock,
            minStock,
          },
          createdAt: BigInt(Date.now()),
        });
      }
    }
  }
}
