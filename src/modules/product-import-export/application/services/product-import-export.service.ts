import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '@modules/product/domain/repositories/product.repository.interface';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '@modules/category/domain/repositories/category.repository.interface';
import { ExportProductsDto } from '../dto/export-products.dto';
import { ImportProductsDto } from '../dto/import-products.dto';
import { EXCEL_CONSTANTS } from '@common/constants/excel.constants';
import { ProductCondition, ProductStatus, ProductBadge } from '@prisma/client';

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ row: number; errors: string[] }>;
}

@Injectable()
export class ProductImportExportService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly prisma: PrismaService,
  ) {}

  async exportProducts(
    sellerId: number,
    exportDto: ExportProductsDto,
    response: Response,
  ): Promise<void> {
    const options: {
      sellerId?: number;
      categoryId?: number;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {
      sellerId,
      page: 1,
      pageSize: 10000,
    };

    if (exportDto.categoryId) {
      options.categoryId = exportDto.categoryId;
    }

    if (exportDto.status) {
      options.status = exportDto.status;
    }

    if (exportDto.search) {
      options.search = exportDto.search;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: EXCEL_CONSTANTS.HEADERS.TITLE, key: 'title', width: 30 },
      { header: EXCEL_CONSTANTS.HEADERS.DESCRIPTION, key: 'description', width: 50 },
      { header: EXCEL_CONSTANTS.HEADERS.CATEGORY_ID, key: 'categoryId', width: 12 },
      { header: EXCEL_CONSTANTS.HEADERS.PRICE, key: 'price', width: 15 },
      { header: EXCEL_CONSTANTS.HEADERS.ORIGINAL_PRICE, key: 'originalPrice', width: 15 },
      { header: EXCEL_CONSTANTS.HEADERS.CONDITION, key: 'condition', width: 12 },
      { header: EXCEL_CONSTANTS.HEADERS.LOCATION, key: 'location', width: 20 },
      { header: EXCEL_CONSTANTS.HEADERS.STOCK, key: 'stock', width: 10 },
      { header: EXCEL_CONSTANTS.HEADERS.MIN_STOCK, key: 'minStock', width: 12 },
      { header: EXCEL_CONSTANTS.HEADERS.MAX_STOCK, key: 'maxStock', width: 12 },
      { header: EXCEL_CONSTANTS.HEADERS.COST_PRICE, key: 'costPrice', width: 15 },
      { header: EXCEL_CONSTANTS.HEADERS.SELLING_PRICE, key: 'sellingPrice', width: 15 },
      { header: EXCEL_CONSTANTS.HEADERS.SKU, key: 'sku', width: 20 },
      { header: EXCEL_CONSTANTS.HEADERS.BARCODE, key: 'barcode', width: 20 },
      { header: EXCEL_CONSTANTS.HEADERS.TAGS, key: 'tags', width: 30 },
      { header: EXCEL_CONSTANTS.HEADERS.BADGES, key: 'badges', width: 20 },
      { header: EXCEL_CONSTANTS.HEADERS.STORE_ID, key: 'storeId', width: 12 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.productRepository.findAll({
        ...options,
        page,
        pageSize: EXCEL_CONSTANTS.BATCH_SIZE,
      });

      for (const product of result.items) {
        worksheet.addRow({
          title: product.title,
          description: product.description || '',
          categoryId: product.categoryId,
          price: product.price,
          originalPrice: product.originalPrice || '',
          condition: product.condition,
          location: product.location || '',
          stock: product.stock,
          minStock: product.minStock,
          maxStock: product.maxStock || '',
          costPrice: product.costPrice || '',
          sellingPrice: product.sellingPrice || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          tags: product.tags.join(', ') || '',
          badges: product.badges.join(', ') || '',
          storeId: product.storeId || '',
        });
      }

      hasMore = result.items.length === EXCEL_CONSTANTS.BATCH_SIZE;
      page++;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.xlsx"`);

    response.send(Buffer.from(buffer));
  }

  async importProducts(
    sellerId: number,
    file: Express.Multer.File,
    importDto: ImportProductsDto,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException({
        message: MESSAGES.EXCEL.FILE_REQUIRED,
        errorCode: ERROR_CODES.EXCEL_FILE_REQUIRED,
      });
    }

    if (file.size > EXCEL_CONSTANTS.MAX_FILE_SIZE) {
      throw new BadRequestException({
        message: MESSAGES.EXCEL.FILE_TOO_LARGE,
        errorCode: ERROR_CODES.EXCEL_FILE_TOO_LARGE,
      });
    }

    const workbook = new ExcelJS.Workbook();
    const buffer: Buffer =
      file.buffer instanceof Buffer
        ? file.buffer
        : Buffer.from(file.buffer as unknown as ArrayBuffer);
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException({
        message: MESSAGES.EXCEL.INVALID_FILE,
        errorCode: ERROR_CODES.EXCEL_INVALID_FILE,
      });
    }

    if (worksheet.rowCount > EXCEL_CONSTANTS.MAX_ROWS + 1) {
      throw new BadRequestException({
        message: MESSAGES.EXCEL.TOO_MANY_ROWS,
        errorCode: ERROR_CODES.EXCEL_TOO_MANY_ROWS,
      });
    }

    const result: ImportResult = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
    };

    const rows: Array<{
      row: number;
      data: Record<string, unknown>;
      errors: string[];
    }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const rowData: Record<string, unknown> = {};
      const errors: string[] = [];

      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value?.toString() || '';
        rowData[header] = cell.value;
      });

      rows.push({ row: rowNumber, data: rowData, errors });
    });

    result.total = rows.length;

    for (let i = 0; i < rows.length; i += EXCEL_CONSTANTS.BATCH_SIZE) {
      const batch = rows.slice(i, i + EXCEL_CONSTANTS.BATCH_SIZE);

      await this.prisma.$transaction(async () => {
        for (const { row, data, errors } of batch) {
          const validationErrors = this.validateProductRow(data);
          errors.push(...validationErrors);

          if (errors.length > 0 && !importDto.skipErrors) {
            result.failed++;
            result.errors.push({ row, errors });
            continue;
          }

          if (errors.length > 0 && importDto.skipErrors) {
            result.failed++;
            result.errors.push({ row, errors });
            continue;
          }

          try {
            const categoryId = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.CATEGORY_ID]);
            if (!categoryId) {
              errors.push('Category ID is required');
              result.failed++;
              result.errors.push({ row, errors });
              continue;
            }

            const category = await this.categoryRepository.findById(categoryId);
            if (!category || !category.isActive) {
              errors.push('Category not found or inactive');
              result.failed++;
              result.errors.push({ row, errors });
              continue;
            }

            const sku = data[EXCEL_CONSTANTS.HEADERS.SKU]?.toString().trim() || null;
            if (sku) {
              const existingProduct = await this.productRepository.findBySku(sku);
              if (existingProduct) {
                if (importDto.updateExisting) {
                  if (existingProduct.sellerId !== sellerId) {
                    errors.push('SKU already exists for another seller');
                    result.failed++;
                    result.errors.push({ row, errors });
                    continue;
                  }

                  await this.productRepository.update(existingProduct.id, {
                    title: data[EXCEL_CONSTANTS.HEADERS.TITLE]?.toString() || '',
                    description: data[EXCEL_CONSTANTS.HEADERS.DESCRIPTION]?.toString() || null,
                    categoryId,
                    price: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.PRICE]) || 0,
                    originalPrice:
                      this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.ORIGINAL_PRICE]) || null,
                    condition: (data[EXCEL_CONSTANTS.HEADERS.CONDITION]?.toString() ||
                      'new') as ProductCondition,
                    location: data[EXCEL_CONSTANTS.HEADERS.LOCATION]?.toString() || null,
                    stock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STOCK]) || 0,
                    minStock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MIN_STOCK]) || 0,
                    maxStock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MAX_STOCK]) || null,
                    costPrice: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.COST_PRICE]) || null,
                    sellingPrice:
                      this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.SELLING_PRICE]) || null,
                    sku,
                    barcode: data[EXCEL_CONSTANTS.HEADERS.BARCODE]?.toString().trim() || null,
                    tags: this.parseArray(data[EXCEL_CONSTANTS.HEADERS.TAGS]),
                    badges: this.parseBadges(data[EXCEL_CONSTANTS.HEADERS.BADGES]),
                    storeId: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STORE_ID]) || null,
                    updatedAt: BigInt(Date.now()),
                  });
                  result.success++;
                } else {
                  errors.push('SKU already exists');
                  result.failed++;
                  result.errors.push({ row, errors });
                }
                continue;
              }
            }

            const sellingPrice = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.SELLING_PRICE]);
            const costPrice = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.COST_PRICE]);
            const profit =
              sellingPrice !== null && costPrice !== null ? sellingPrice - costPrice : null;
            const profitMargin =
              profit !== null && costPrice !== null && costPrice > 0
                ? (profit / costPrice) * 100
                : null;

            await this.productRepository.create({
              sellerId,
              storeId: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STORE_ID]) || null,
              categoryId,
              title: data[EXCEL_CONSTANTS.HEADERS.TITLE]?.toString() || '',
              description: data[EXCEL_CONSTANTS.HEADERS.DESCRIPTION]?.toString() || null,
              price: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.PRICE]) || 0,
              originalPrice: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.ORIGINAL_PRICE]) || null,
              condition: (data[EXCEL_CONSTANTS.HEADERS.CONDITION]?.toString() ||
                'new') as ProductCondition,
              location: data[EXCEL_CONSTANTS.HEADERS.LOCATION]?.toString() || null,
              stock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STOCK]) || 0,
              minStock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MIN_STOCK]) || 0,
              maxStock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MAX_STOCK]) || null,
              reservedStock: 0,
              availableStock: this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STOCK]) || 0,
              costPrice: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.COST_PRICE]) || null,
              sellingPrice: this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.SELLING_PRICE]) || null,
              profit,
              profitMargin,
              sku,
              barcode: data[EXCEL_CONSTANTS.HEADERS.BARCODE]?.toString().trim() || null,
              status: ProductStatus.draft,
              rating: 0,
              reviewCount: 0,
              viewCount: 0,
              salesCount: 0,
              isFeatured: false,
              isPromoted: false,
              tags: this.parseArray(data[EXCEL_CONSTANTS.HEADERS.TAGS]),
              badges: this.parseBadges(data[EXCEL_CONSTANTS.HEADERS.BADGES]),
              inventoryInfo: {},
              metadata: {},
              createdAt: BigInt(Date.now()),
              updatedAt: BigInt(Date.now()),
            });

            result.success++;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
            result.failed++;
            result.errors.push({ row, errors });
          }
        }
      });
    }

    return result;
  }

  private validateProductRow(data: Record<string, unknown>): string[] {
    const errors: string[] = [];

    const title = data[EXCEL_CONSTANTS.HEADERS.TITLE]?.toString()?.trim();
    if (!title) {
      errors.push('Title is required');
    } else if (title.length > 500) {
      errors.push('Title must not exceed 500 characters');
    }

    const description = data[EXCEL_CONSTANTS.HEADERS.DESCRIPTION]?.toString();
    if (description && description.length > 10000) {
      errors.push('Description must not exceed 10000 characters');
    }

    const categoryId = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.CATEGORY_ID]);
    if (!categoryId || categoryId < 1) {
      errors.push('Category ID is required and must be greater than 0');
    }

    const price = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.PRICE]);
    if (!price && price !== 0) {
      errors.push('Price is required');
    } else if (price < 0) {
      errors.push('Price must be greater than or equal to 0');
    }

    const condition = data[EXCEL_CONSTANTS.HEADERS.CONDITION]?.toString();
    if (condition && !EXCEL_CONSTANTS.CONDITION_VALUES.includes(condition as ProductCondition)) {
      errors.push(`Condition must be one of: ${EXCEL_CONSTANTS.CONDITION_VALUES.join(', ')}`);
    }

    const stock = this.parseInt(data[EXCEL_CONSTANTS.HEADERS.STOCK]);
    if (stock !== null && stock < 0) {
      errors.push('Stock must be greater than or equal to 0');
    }

    const minStock = this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MIN_STOCK]);
    if (minStock !== null && minStock < 0) {
      errors.push('Min Stock must be greater than or equal to 0');
    }

    const maxStock = this.parseInt(data[EXCEL_CONSTANTS.HEADERS.MAX_STOCK]);
    if (maxStock !== null && maxStock < 0) {
      errors.push('Max Stock must be greater than or equal to 0');
    }

    if (minStock !== null && maxStock !== null && minStock > maxStock) {
      errors.push('Min Stock must be less than or equal to Max Stock');
    }

    const costPrice = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.COST_PRICE]);
    if (costPrice !== null && costPrice < 0) {
      errors.push('Cost Price must be greater than or equal to 0');
    }

    const sellingPrice = this.parseNumber(data[EXCEL_CONSTANTS.HEADERS.SELLING_PRICE]);
    if (sellingPrice !== null && sellingPrice < 0) {
      errors.push('Selling Price must be greater than or equal to 0');
    }

    const sku = data[EXCEL_CONSTANTS.HEADERS.SKU]?.toString()?.trim();
    if (sku && sku.length > 100) {
      errors.push('SKU must not exceed 100 characters');
    }

    const barcode = data[EXCEL_CONSTANTS.HEADERS.BARCODE]?.toString()?.trim();
    if (barcode && barcode.length > 100) {
      errors.push('Barcode must not exceed 100 characters');
    }

    const location = data[EXCEL_CONSTANTS.HEADERS.LOCATION]?.toString();
    if (location && location.length > 255) {
      errors.push('Location must not exceed 255 characters');
    }

    return errors;
  }

  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? null : parsed;
  }

  private parseInt(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    const parsed = parseInt(value.toString(), 10);
    return isNaN(parsed) ? null : parsed;
  }

  private parseArray(value: unknown): string[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((v) => v.toString().trim()).filter((v) => v);
    }
    return value
      .toString()
      .split(',')
      .map((v: string) => v.trim())
      .filter((v: string) => v);
  }

  private parseBadges(value: unknown): ProductBadge[] {
    const badges = this.parseArray(value);
    return badges.filter((badge) =>
      EXCEL_CONSTANTS.BADGE_VALUES.includes(badge.toUpperCase() as ProductBadge),
    ) as ProductBadge[];
  }
}
