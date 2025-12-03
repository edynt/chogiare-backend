import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateCategoryDto {
  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  name: string;

  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.IS_NOT_EMPTY })
  @MaxLength(255, { message: VALIDATION_MESSAGES.MAX_LENGTH(255) })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: VALIDATION_MESSAGES.SLUG_PATTERN,
  })
  slug: string;

  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsOptional()
  @MaxLength(2000, { message: VALIDATION_MESSAGES.MAX_LENGTH(2000) })
  description?: string;

  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.MAX_LENGTH(500) })
  @Matches(/^https?:\/\/.+/, { message: VALIDATION_MESSAGES.IS_URL })
  image?: string;

  @IsString({ message: VALIDATION_MESSAGES.IS_STRING })
  @IsOptional()
  parentId?: string;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_BOOLEAN })
  @IsOptional()
  isActive?: boolean;
}
