import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';
import { FILE_UPLOAD_PATHS, FileUploadPath } from '@common/constants/file.constants';

export class UploadFileDto {
  @ApiProperty({
    description: 'Upload path/category',
    example: 'products',
    enum: Object.values(FILE_UPLOAD_PATHS),
    required: false,
  })
  @IsOptional()
  @IsEnum(Object.values(FILE_UPLOAD_PATHS), { message: VALIDATION_MESSAGES.IS_ENUM })
  path?: FileUploadPath;

  @ApiProperty({
    description: 'Custom folder name (optional)',
    example: 'product-123',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  folder?: string;
}
