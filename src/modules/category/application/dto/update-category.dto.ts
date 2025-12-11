import { IsOptional, IsString, IsInt, IsBoolean, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  name?: string;

  @ApiProperty({
    description: 'Category slug',
    example: 'electronics',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  slug?: string;

  @ApiProperty({
    description: 'Category description',
    example: 'Electronic products and devices',
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  description?: string;

  @ApiProperty({
    description: 'Category image URL',
    example: 'https://example.com/category.jpg',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  image?: string;

  @ApiProperty({
    description: 'Parent category ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(1, { message: VALIDATION_MESSAGES.MIN(1) })
  parentId?: number | null;

  @ApiProperty({
    description: 'Display order',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: VALIDATION_MESSAGES.IS_NUMBER })
  @Min(0, { message: VALIDATION_MESSAGES.MIN(0) })
  displayOrder?: number;

  @ApiProperty({
    description: 'Is category active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  isActive?: boolean;
}
