import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
  IsInt,
  IsEmail,
  IsUrl,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '@common/constants/messages.constants';

export class CreateStoreDto {
  @IsString({ message: VALIDATION_MESSAGES.STORE_NAME.IS_STRING })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.STORE_NAME.IS_REQUIRED })
  @MaxLength(255, { message: VALIDATION_MESSAGES.STORE_NAME.MAX_LENGTH_255 })
  name: string;

  @IsString({ message: VALIDATION_MESSAGES.SLUG.IS_STRING })
  @IsOptional()
  @MaxLength(255, { message: VALIDATION_MESSAGES.SLUG.MAX_LENGTH_255 })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: VALIDATION_MESSAGES.SLUG.PATTERN,
  })
  slug?: string;

  @IsString({ message: VALIDATION_MESSAGES.DESCRIPTION.IS_STRING })
  @IsOptional()
  description?: string;

  @IsString({ message: VALIDATION_MESSAGES.SHORT_DESCRIPTION.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.SHORT_DESCRIPTION.MAX_LENGTH_500 })
  shortDescription?: string;

  @IsString({ message: VALIDATION_MESSAGES.LOGO.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.LOGO.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.LOGO.IS_URL })
  logo?: string;

  @IsString({ message: VALIDATION_MESSAGES.BANNER.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.BANNER.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.BANNER.IS_URL })
  banner?: string;

  @IsString({ message: VALIDATION_MESSAGES.CATEGORY.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.CATEGORY.MAX_LENGTH_100 })
  category?: string;

  @IsString({ message: VALIDATION_MESSAGES.SUBCATEGORY.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.SUBCATEGORY.MAX_LENGTH_100 })
  subcategory?: string;

  @IsInt({ message: VALIDATION_MESSAGES.ESTABLISHED_YEAR.IS_INT })
  @IsOptional()
  @Min(1900, { message: VALIDATION_MESSAGES.ESTABLISHED_YEAR.MIN })
  @Max(new Date().getFullYear(), { message: VALIDATION_MESSAGES.ESTABLISHED_YEAR.MAX })
  establishedYear?: number;

  @IsString({ message: VALIDATION_MESSAGES.BUSINESS_TYPE.IS_STRING })
  @IsOptional()
  @MaxLength(50, { message: VALIDATION_MESSAGES.BUSINESS_TYPE.MAX_LENGTH_50 })
  businessType?: string;

  @IsString({ message: VALIDATION_MESSAGES.TAX_CODE.IS_STRING })
  @IsOptional()
  @MaxLength(50, { message: VALIDATION_MESSAGES.TAX_CODE.MAX_LENGTH_50 })
  taxCode?: string;

  @IsString({ message: VALIDATION_MESSAGES.BUSINESS_LICENSE.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.BUSINESS_LICENSE.MAX_LENGTH_100 })
  businessLicense?: string;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_STREET.IS_STRING })
  @IsOptional()
  @MaxLength(255, { message: VALIDATION_MESSAGES.ADDRESS_STREET.MAX_LENGTH_255 })
  addressStreet?: string;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_WARD.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.ADDRESS_WARD.MAX_LENGTH_100 })
  addressWard?: string;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_DISTRICT.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.ADDRESS_DISTRICT.MAX_LENGTH_100 })
  addressDistrict?: string;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_CITY.IS_STRING })
  @IsOptional()
  @MaxLength(100, { message: VALIDATION_MESSAGES.ADDRESS_CITY.MAX_LENGTH_100 })
  addressCity?: string;

  @IsString({ message: VALIDATION_MESSAGES.ADDRESS_POSTAL_CODE.IS_STRING })
  @IsOptional()
  @MaxLength(20, { message: VALIDATION_MESSAGES.ADDRESS_POSTAL_CODE.MAX_LENGTH_20 })
  addressPostalCode?: string;

  @IsNumber({}, { message: VALIDATION_MESSAGES.ADDRESS_LAT.IS_NUMBER })
  @IsOptional()
  addressLat?: number;

  @IsNumber({}, { message: VALIDATION_MESSAGES.ADDRESS_LNG.IS_NUMBER })
  @IsOptional()
  addressLng?: number;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_PHONE.IS_STRING })
  @IsOptional()
  @MaxLength(20, { message: VALIDATION_MESSAGES.CONTACT_PHONE.MAX_LENGTH_20 })
  @Matches(/^[0-9+\-\s()]+$/, {
    message: VALIDATION_MESSAGES.CONTACT_PHONE.PATTERN,
  })
  contactPhone?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_EMAIL.IS_STRING })
  @IsOptional()
  @MaxLength(255, { message: VALIDATION_MESSAGES.CONTACT_EMAIL.MAX_LENGTH_255 })
  @IsEmail({}, { message: VALIDATION_MESSAGES.CONTACT_EMAIL.IS_EMAIL })
  contactEmail?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_WEBSITE.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.CONTACT_WEBSITE.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.CONTACT_WEBSITE.IS_URL })
  contactWebsite?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_FACEBOOK.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.CONTACT_FACEBOOK.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.CONTACT_FACEBOOK.IS_URL })
  contactFacebook?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_INSTAGRAM.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.CONTACT_INSTAGRAM.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.CONTACT_INSTAGRAM.IS_URL })
  contactInstagram?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_TIKTOK.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.CONTACT_TIKTOK.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.CONTACT_TIKTOK.IS_URL })
  contactTiktok?: string;

  @IsString({ message: VALIDATION_MESSAGES.CONTACT_YOUTUBE.IS_STRING })
  @IsOptional()
  @MaxLength(500, { message: VALIDATION_MESSAGES.CONTACT_YOUTUBE.MAX_LENGTH_500 })
  @IsUrl({}, { message: VALIDATION_MESSAGES.CONTACT_YOUTUBE.IS_URL })
  contactYoutube?: string;

  @IsString({ message: VALIDATION_MESSAGES.RETURN_POLICY.IS_STRING })
  @IsOptional()
  returnPolicy?: string;

  @IsString({ message: VALIDATION_MESSAGES.SHIPPING_POLICY.IS_STRING })
  @IsOptional()
  shippingPolicy?: string;

  @IsBoolean({ message: VALIDATION_MESSAGES.IS_ACTIVE.IS_BOOLEAN })
  @IsOptional()
  isActive?: boolean;
}
