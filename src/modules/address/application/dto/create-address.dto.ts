import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateAddressDto {
  @IsString({ message: VALIDATION_MESSAGES.RECIPIENT_NAME.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.RECIPIENT_NAME.IS_REQUIRED })
  @MaxLength(255, { message: VALIDATION_MESSAGES.RECIPIENT_NAME.MAX_LENGTH_255 })
  recipientName: string;

  @IsString({ message: VALIDATION_MESSAGES.RECIPIENT_PHONE.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.RECIPIENT_PHONE.IS_REQUIRED })
  @MaxLength(20, { message: VALIDATION_MESSAGES.RECIPIENT_PHONE.MAX_LENGTH_20 })
  @Matches(/^[0-9+\-\s()]+$/, {
    message: VALIDATION_MESSAGES.RECIPIENT_PHONE.PATTERN,
  })
  recipientPhone: string;

  @IsString({ message: VALIDATION_MESSAGES.STREET.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STREET.IS_REQUIRED })
  @MaxLength(255, { message: VALIDATION_MESSAGES.STREET.MAX_LENGTH_255 })
  street: string;

  @IsString({ message: VALIDATION_MESSAGES.CITY.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.CITY.IS_REQUIRED })
  @MaxLength(100, { message: VALIDATION_MESSAGES.CITY.MAX_LENGTH_100 })
  city: string;

  @IsString({ message: VALIDATION_MESSAGES.STATE.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STATE.IS_REQUIRED })
  @MaxLength(100, { message: VALIDATION_MESSAGES.STATE.MAX_LENGTH_100 })
  state: string;

  @IsString({ message: VALIDATION_MESSAGES.DISTRICT.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.DISTRICT.MAX_LENGTH_100 })
  district?: string;

  @IsString({ message: VALIDATION_MESSAGES.WARD.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.WARD.MAX_LENGTH_100 })
  ward?: string;

  @IsString({ message: VALIDATION_MESSAGES.ZIP_CODE.IS_STRING })
  @IsOptional()
  @MaxLength(20, { message: VALIDATION_MESSAGES.ZIP_CODE.MAX_LENGTH_20 })
  zipCode?: string;

  @IsString({ message: VALIDATION_MESSAGES.COUNTRY.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.COUNTRY.IS_REQUIRED })
  @MaxLength(100, { message: VALIDATION_MESSAGES.COUNTRY.MAX_LENGTH_100 })
  country: string;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_DEFAULT.IS_BOOLEAN })
  @IsOptional()
  isDefault?: boolean;
}

