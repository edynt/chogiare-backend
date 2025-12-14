import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from '@modules/upload/application/services/upload.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { MESSAGES } from '@common/constants/messages.constants';
import { FILE_UPLOAD_PATHS, FileUploadPath } from '@common/constants/file.constants';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a single file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
          enum: Object.values(FILE_UPLOAD_PATHS),
          description: 'Upload path/category',
        },
        folder: {
          type: 'string',
          description: 'Custom folder name',
        },
      },
    },
  })
  @ApiQuery({
    name: 'imageOnly',
    required: false,
    type: Boolean,
    description: 'Restrict to image files only',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('path') path?: string,
    @Query('folder') folder?: string,
    @Query('imageOnly') imageOnly?: string,
  ) {
    const result = await this.uploadService.uploadFile(
      file,
      path as FileUploadPath | undefined,
      folder,
      imageOnly === 'true',
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: result,
    };
  }

  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple files to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        path: {
          type: 'string',
          enum: Object.values(FILE_UPLOAD_PATHS),
          description: 'Upload path/category',
        },
        folder: {
          type: 'string',
          description: 'Custom folder name',
        },
      },
    },
  })
  @ApiQuery({
    name: 'imageOnly',
    required: false,
    type: Boolean,
    description: 'Restrict to image files only',
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('path') path?: string,
    @Query('folder') folder?: string,
    @Query('imageOnly') imageOnly?: string,
  ) {
    const results = await this.uploadService.uploadMultipleFiles(
      files,
      path as FileUploadPath | undefined,
      folder,
      imageOnly === 'true',
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: results,
    };
  }

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a single image to S3 (images only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        path: {
          type: 'string',
          enum: Object.values(FILE_UPLOAD_PATHS),
          description: 'Upload path/category',
        },
        folder: {
          type: 'string',
          description: 'Custom folder name',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('path') path?: string,
    @Query('folder') folder?: string,
  ) {
    const result = await this.uploadService.uploadFile(
      file,
      path as FileUploadPath | undefined,
      folder,
      true,
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: result,
    };
  }

  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload multiple images to S3 (images only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        path: {
          type: 'string',
          enum: Object.values(FILE_UPLOAD_PATHS),
          description: 'Upload path/category',
        },
        folder: {
          type: 'string',
          description: 'Custom folder name',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('path') path?: string,
    @Query('folder') folder?: string,
  ) {
    const results = await this.uploadService.uploadMultipleFiles(
      files,
      path as FileUploadPath | undefined,
      folder,
      true,
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: results,
    };
  }

  @Delete('file')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'S3 object key',
        },
      },
    },
  })
  async deleteFile(@Body('key') key: string) {
    await this.uploadService.deleteFile(key);
    return {
      message: MESSAGES.UPLOAD.DELETE_SUCCESS,
    };
  }

  @Delete('files')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete multiple files from S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of S3 object keys',
        },
      },
    },
  })
  async deleteFiles(@Body('keys') keys: string[]) {
    await this.uploadService.deleteMultipleFiles(keys);
    return {
      message: MESSAGES.UPLOAD.DELETE_SUCCESS,
    };
  }

  @Post('product-images')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload product images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        productId: {
          type: 'string',
          description: 'Product ID (optional, for folder organization)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('productId') productId?: string,
  ) {
    const results = await this.uploadService.uploadMultipleFiles(
      files,
      FILE_UPLOAD_PATHS.PRODUCTS,
      productId,
      true,
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: results,
    };
  }

  @Post('store-image')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload store image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        storeId: {
          type: 'string',
          description: 'Store ID (optional, for folder organization)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadStoreImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('storeId') storeId?: string,
  ) {
    const result = await this.uploadService.uploadFile(
      file,
      FILE_UPLOAD_PATHS.STORES,
      storeId,
      true,
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: result,
    };
  }

  @Post('avatar')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.uploadService.uploadFile(
      file,
      FILE_UPLOAD_PATHS.AVATARS,
      user.id.toString(),
      true,
    );
    return {
      message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
      data: result,
    };
  }

  @Get('files/:key')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get file info by key' })
  @ApiParam({ name: 'key', type: String, description: 'S3 object key' })
  async getFileInfo(@Param('key') key: string) {
    const fileInfo = await this.uploadService.getFileInfo(key);
    return {
      message: MESSAGES.SUCCESS,
      data: fileInfo,
    };
  }

  @Delete('files/:key')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete file by key' })
  @ApiParam({ name: 'key', type: String, description: 'S3 object key' })
  async deleteFileByKey(@Param('key') key: string) {
    await this.uploadService.deleteFile(key);
    return {
      message: MESSAGES.UPLOAD.DELETE_SUCCESS,
    };
  }

  @Get('files')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user files (by path prefix)' })
  @ApiQuery({ name: 'path', required: false, type: String, description: 'File path prefix' })
  @ApiQuery({ name: 'folder', required: false, type: String, description: 'Folder name' })
  async getUserFiles(
    @CurrentUser() user: CurrentUserPayload,
    @Query('path') path?: string,
    @Query('folder') folder?: string,
  ) {
    const prefix = path
      ? folder
        ? `${path}/${folder}/`
        : `${path}/`
      : folder
        ? `${folder}/`
        : '';
    const files = await this.uploadService.listFiles(prefix);
    return {
      message: MESSAGES.SUCCESS,
      data: files,
    };
  }
}
