import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneralSettingsDto {
  @ApiProperty()
  @IsString()
  siteName: string;

  @ApiProperty()
  @IsString()
  siteDescription: string;

  @ApiProperty()
  @IsString()
  siteUrl: string;

  @ApiProperty()
  @IsString()
  adminEmail: string;

  @ApiProperty()
  @IsString()
  supportEmail: string;

  @ApiProperty()
  @IsString()
  supportPhone: string;

  @ApiProperty()
  @IsString()
  timezone: string;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsString()
  dateFormat: string;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsBoolean()
  maintenanceMode: boolean;

  @ApiProperty()
  @IsString()
  maintenanceMessage: string;

  @ApiProperty()
  @IsBoolean()
  registrationEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  emailVerification: boolean;

  @ApiProperty()
  @IsBoolean()
  phoneVerification: boolean;
}

export class PaymentMethodsDto {
  @ApiProperty()
  @IsBoolean()
  creditCard: boolean;

  @ApiProperty()
  @IsBoolean()
  momo: boolean;

  @ApiProperty()
  @IsBoolean()
  zalopay: boolean;

  @ApiProperty()
  @IsBoolean()
  vnpay: boolean;

  @ApiProperty()
  @IsBoolean()
  bankTransfer: boolean;

  @ApiProperty()
  @IsBoolean()
  cod: boolean;
}

export class PaymentSettingsDto {
  @ApiProperty()
  @IsString()
  defaultCurrency: string;

  @ApiProperty()
  @IsArray()
  supportedCurrencies: string[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => PaymentMethodsDto)
  paymentMethods: PaymentMethodsDto;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate: number;

  @ApiProperty()
  @IsString()
  commissionType: string;

  @ApiProperty()
  @IsNumber()
  minimumWithdraw: number;

  @ApiProperty()
  @IsNumber()
  maximumWithdraw: number;

  @ApiProperty()
  @IsNumber()
  withdrawFee: number;

  @ApiProperty()
  @IsNumber()
  paymentTimeout: number;

  @ApiProperty()
  @IsNumber()
  refundPeriod: number;

  @ApiProperty()
  @IsBoolean()
  autoPayoutEnabled: boolean;

  @ApiProperty()
  @IsString()
  payoutSchedule: string;

  @ApiProperty()
  @IsNumber()
  holdPeriod: number;
}

export class ProductSettingsDto {
  @ApiProperty()
  @IsNumber()
  maxProductsPerUser: number;

  @ApiProperty()
  @IsNumber()
  maxProductsPerFreePlan: number;

  @ApiProperty()
  @IsNumber()
  maxImagesPerProduct: number;

  @ApiProperty()
  @IsNumber()
  maxVideoPerProduct: number;

  @ApiProperty()
  @IsNumber()
  maxFileSize: number;

  @ApiProperty()
  @IsArray()
  allowedImageFormats: string[];

  @ApiProperty()
  @IsBoolean()
  autoApprove: boolean;

  @ApiProperty()
  @IsBoolean()
  moderationRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  aiModeration: boolean;

  @ApiProperty()
  @IsNumber()
  featuredPrice: number;

  @ApiProperty()
  @IsNumber()
  promotedPrice: number;

  @ApiProperty()
  @IsNumber()
  boostPrice: number;

  @ApiProperty()
  @IsNumber()
  productExpiryDays: number;

  @ApiProperty()
  @IsBoolean()
  autoRenew: boolean;

  @ApiProperty()
  @IsNumber()
  lowStockThreshold: number;

  @ApiProperty()
  @IsString()
  outOfStockBehavior: string;

  @ApiProperty()
  @IsBoolean()
  allowPreorder: boolean;

  @ApiProperty()
  @IsBoolean()
  allowDigitalProducts: boolean;

  @ApiProperty()
  @IsBoolean()
  requireSKU: boolean;

  @ApiProperty()
  @IsBoolean()
  requireBarcode: boolean;
}

export class UserSettingsDto {
  @ApiProperty()
  @IsNumber()
  maxLoginAttempts: number;

  @ApiProperty()
  @IsNumber()
  lockoutDuration: number;

  @ApiProperty()
  @IsNumber()
  passwordMinLength: number;

  @ApiProperty()
  @IsBoolean()
  requireUppercase: boolean;

  @ApiProperty()
  @IsBoolean()
  requireNumber: boolean;

  @ApiProperty()
  @IsBoolean()
  requireSpecialChar: boolean;

  @ApiProperty()
  @IsNumber()
  passwordExpiry: number;

  @ApiProperty()
  @IsNumber()
  sessionTimeout: number;

  @ApiProperty()
  @IsNumber()
  rememberMeDuration: number;

  @ApiProperty()
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  smsNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  pushNotifications: boolean;

  @ApiProperty()
  @IsBoolean()
  twoFactorAuth: boolean;

  @ApiProperty()
  @IsArray()
  twoFactorMethods: string[];

  @ApiProperty()
  @IsBoolean()
  profileCompletion: boolean;

  @ApiProperty()
  @IsBoolean()
  avatarRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  phoneRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  addressRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  identityVerification: boolean;

  @ApiProperty()
  @IsBoolean()
  sellerVerification: boolean;
}

export class NotificationTemplatesDto {
  @ApiProperty()
  @IsBoolean()
  welcome: boolean;

  @ApiProperty()
  @IsBoolean()
  orderConfirmation: boolean;

  @ApiProperty()
  @IsBoolean()
  orderShipped: boolean;

  @ApiProperty()
  @IsBoolean()
  orderDelivered: boolean;

  @ApiProperty()
  @IsBoolean()
  passwordReset: boolean;

  @ApiProperty()
  @IsBoolean()
  priceAlert: boolean;

  @ApiProperty()
  @IsBoolean()
  newMessage: boolean;
}

export class NotificationSettingsDto {
  @ApiProperty()
  @IsBoolean()
  emailEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  smsEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  pushEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  inAppEnabled: boolean;

  @ApiProperty()
  @IsString()
  emailFrom: string;

  @ApiProperty()
  @IsString()
  emailFromName: string;

  @ApiProperty()
  @IsString()
  smsProvider: string;

  @ApiProperty()
  @IsString()
  pushProvider: string;

  @ApiProperty()
  @IsBoolean()
  notificationQueue: boolean;

  @ApiProperty()
  @IsNumber()
  batchSize: number;

  @ApiProperty()
  @IsNumber()
  retryAttempts: number;

  @ApiProperty()
  @IsNumber()
  retryDelay: number;

  @ApiProperty()
  @IsBoolean()
  digestEnabled: boolean;

  @ApiProperty()
  @IsString()
  digestFrequency: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => NotificationTemplatesDto)
  templates: NotificationTemplatesDto;
}

export class SecuritySettingsDto {
  @ApiProperty()
  @IsBoolean()
  sslEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  forceHttps: boolean;

  @ApiProperty()
  @IsBoolean()
  corsEnabled: boolean;

  @ApiProperty()
  @IsArray()
  corsOrigins: string[];

  @ApiProperty()
  @IsBoolean()
  rateLimiting: boolean;

  @ApiProperty()
  @IsNumber()
  rateLimit: number;

  @ApiProperty()
  @IsNumber()
  rateLimitWindow: number;

  @ApiProperty()
  @IsBoolean()
  apiKeyRequired: boolean;

  @ApiProperty()
  @IsBoolean()
  ipWhitelist: boolean;

  @ApiProperty()
  @IsArray()
  whitelistedIPs: string[];

  @ApiProperty()
  @IsArray()
  blacklistedIPs: string[];

  @ApiProperty()
  @IsBoolean()
  auditLogging: boolean;

  @ApiProperty()
  @IsNumber()
  auditRetention: number;

  @ApiProperty()
  @IsBoolean()
  dataEncryption: boolean;

  @ApiProperty()
  @IsString()
  encryptionAlgorithm: string;

  @ApiProperty()
  @IsBoolean()
  sessionEncryption: boolean;

  @ApiProperty()
  @IsBoolean()
  cookieSecure: boolean;

  @ApiProperty()
  @IsString()
  cookieSameSite: string;

  @ApiProperty()
  @IsBoolean()
  csrfProtection: boolean;

  @ApiProperty()
  @IsBoolean()
  xssProtection: boolean;

  @ApiProperty()
  @IsBoolean()
  contentSecurityPolicy: boolean;

  @ApiProperty()
  @IsBoolean()
  captchaEnabled: boolean;

  @ApiProperty()
  @IsString()
  captchaProvider: string;

  @ApiProperty()
  @IsBoolean()
  captchaOnLogin: boolean;

  @ApiProperty()
  @IsBoolean()
  captchaOnRegister: boolean;

  @ApiProperty()
  @IsBoolean()
  captchaOnContact: boolean;
}

export class SeoSettingsDto {
  @ApiProperty()
  @IsString()
  metaTitle: string;

  @ApiProperty()
  @IsString()
  metaDescription: string;

  @ApiProperty()
  @IsString()
  metaKeywords: string;

  @ApiProperty()
  @IsString()
  ogImage: string;

  @ApiProperty()
  @IsString()
  twitterCard: string;

  @ApiProperty()
  @IsString()
  canonicalUrl: string;

  @ApiProperty()
  @IsBoolean()
  robotsTxt: boolean;

  @ApiProperty()
  @IsBoolean()
  sitemapEnabled: boolean;

  @ApiProperty()
  @IsString()
  sitemapFrequency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleAnalytics?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleTagManager?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookPixel?: string;

  @ApiProperty()
  @IsBoolean()
  structuredData: boolean;

  @ApiProperty()
  @IsBoolean()
  breadcrumbs: boolean;
}

export class EmailSettingsDto {
  @ApiProperty()
  @IsString()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sendgridApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailgunApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mailgunDomain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sesRegion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sesAccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sesSecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testEmail?: string;

  @ApiProperty()
  @IsString()
  emailFooter: string;

  @ApiProperty()
  @IsBoolean()
  unsubscribeLink: boolean;
}

export class StorageSettingsDto {
  @ApiProperty()
  @IsString()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3Bucket?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3Region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3AccessKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3SecretKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  s3Endpoint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cloudinaryCloudName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cloudinaryApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cloudinaryApiSecret?: string;

  @ApiProperty()
  @IsBoolean()
  cdnEnabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cdnUrl?: string;

  @ApiProperty()
  @IsBoolean()
  imageOptimization: boolean;

  @ApiProperty()
  @IsNumber()
  imageQuality: number;

  @ApiProperty()
  @IsArray()
  thumbnailSizes: number[];

  @ApiProperty()
  @IsNumber()
  maxUploadSize: number;

  @ApiProperty()
  @IsArray()
  allowedFileTypes: string[];
}

export class CacheSettingsDto {
  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiProperty()
  @IsString()
  driver: string;

  @ApiProperty()
  @IsNumber()
  ttl: number;

  @ApiProperty()
  @IsString()
  prefix: string;

  @ApiProperty()
  @IsBoolean()
  pageCache: boolean;

  @ApiProperty()
  @IsNumber()
  pageCacheTtl: number;

  @ApiProperty()
  @IsBoolean()
  apiCache: boolean;

  @ApiProperty()
  @IsNumber()
  apiCacheTtl: number;

  @ApiProperty()
  @IsBoolean()
  queryCache: boolean;

  @ApiProperty()
  @IsNumber()
  queryCacheTtl: number;

  @ApiProperty()
  @IsBoolean()
  staticCache: boolean;

  @ApiProperty()
  @IsNumber()
  staticCacheTtl: number;
}

export class SocialLoginDto {
  @ApiProperty()
  @IsBoolean()
  facebook: boolean;

  @ApiProperty()
  @IsBoolean()
  google: boolean;

  @ApiProperty()
  @IsBoolean()
  apple: boolean;

  @ApiProperty()
  @IsBoolean()
  zalo: boolean;
}

export class SocialShareDto {
  @ApiProperty()
  @IsBoolean()
  facebook: boolean;

  @ApiProperty()
  @IsBoolean()
  twitter: boolean;

  @ApiProperty()
  @IsBoolean()
  pinterest: boolean;

  @ApiProperty()
  @IsBoolean()
  whatsapp: boolean;

  @ApiProperty()
  @IsBoolean()
  zalo: boolean;

  @ApiProperty()
  @IsBoolean()
  copyLink: boolean;
}

export class SocialSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tiktokUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zaloOA?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookAppId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  facebookAppSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleClientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appleClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appleTeamId?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SocialLoginDto)
  socialLogin: SocialLoginDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SocialShareDto)
  socialShare: SocialShareDto;
}

export class LegalSettingsDto {
  @ApiProperty()
  @IsString()
  termsOfService: string;

  @ApiProperty()
  @IsString()
  privacyPolicy: string;

  @ApiProperty()
  @IsString()
  refundPolicy: string;

  @ApiProperty()
  @IsString()
  shippingPolicy: string;

  @ApiProperty()
  @IsString()
  cookiePolicy: string;

  @ApiProperty()
  @IsBoolean()
  gdprCompliance: boolean;

  @ApiProperty()
  @IsBoolean()
  cookieConsent: boolean;

  @ApiProperty()
  @IsBoolean()
  ageVerification: boolean;

  @ApiProperty()
  @IsNumber()
  minimumAge: number;

  @ApiProperty()
  @IsBoolean()
  taxEnabled: boolean;

  @ApiProperty()
  @IsNumber()
  taxRate: number;

  @ApiProperty()
  @IsBoolean()
  taxIncluded: boolean;

  @ApiProperty()
  @IsBoolean()
  invoiceEnabled: boolean;

  @ApiProperty()
  @IsString()
  invoicePrefix: string;
}

export class SystemSettingsDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general: GeneralSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  payment: PaymentSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ProductSettingsDto)
  product: ProductSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => UserSettingsDto)
  user: UserSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notification: NotificationSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security: SecuritySettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seo: SeoSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => EmailSettingsDto)
  email: EmailSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => StorageSettingsDto)
  storage: StorageSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @ApiProperty()
  @ValidateNested()
  @Type(() => CacheSettingsDto)
  cache: CacheSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => SocialSettingsDto)
  social: SocialSettingsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LegalSettingsDto)
  legal: LegalSettingsDto;
}

export class UpdateSettingsCategoryDto {
  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsObject()
  settings: Record<string, unknown>;
}
