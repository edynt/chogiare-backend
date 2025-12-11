import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ProductImportExportService } from '@modules/product-import-export/application/services/product-import-export.service';
import { ExportProductsDto } from '@modules/product-import-export/application/dto/export-products.dto';
import { ImportProductsDto } from '@modules/product-import-export/application/dto/import-products.dto';
import { EXCEL_CONSTANTS } from '@common/constants/excel.constants';

@ApiTags('Product Import/Export')
@Controller('products/import-export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductImportExportController {
  constructor(private readonly productImportExportService: ProductImportExportService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export products to Excel' })
  @HttpCode(HttpStatus.OK)
  async exportProducts(
    @CurrentUser('id') userId: number,
    @Query() exportDto: ExportProductsDto,
    @Res() response: Response,
  ) {
    await this.productImportExportService.exportProducts(userId, exportDto, response);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import products from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        skipErrors: {
          type: 'boolean',
          default: false,
        },
        updateExisting: {
          type: 'boolean',
          default: false,
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: EXCEL_CONSTANTS.MAX_FILE_SIZE,
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async importProducts(
    @CurrentUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportProductsDto,
  ) {
    const result = await this.productImportExportService.importProducts(userId, file, importDto);

    return {
      message:
        result.failed > 0 ? 'Products imported with some errors' : 'Products imported successfully',
      data: result,
    };
  }
}
