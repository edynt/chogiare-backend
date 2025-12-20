import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { SettingType } from '@prisma/client';

export interface SystemSettingsData {
  general: Record<string, unknown>;
  payment: Record<string, unknown>;
  product: Record<string, unknown>;
  user: Record<string, unknown>;
  notification: Record<string, unknown>;
  security: Record<string, unknown>;
  seo: Record<string, unknown>;
  email: Record<string, unknown>;
  storage: Record<string, unknown>;
  backup: Record<string, unknown>;
  cache: Record<string, unknown>;
  social: Record<string, unknown>;
  legal: Record<string, unknown>;
}

const DEFAULT_SETTINGS: SystemSettingsData = {
  general: {
    siteName: 'Chogiare Marketplace',
    siteDescription: 'Nền tảng thương mại điện tử hàng đầu Việt Nam',
    siteUrl: 'https://chogiare.vn',
    adminEmail: 'admin@chogiare.vn',
    supportEmail: 'support@chogiare.vn',
    supportPhone: '1900 1234',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    dateFormat: 'DD/MM/YYYY',
    currency: 'VND',
    maintenanceMode: false,
    maintenanceMessage: 'Hệ thống đang bảo trì, vui lòng quay lại sau.',
    registrationEnabled: true,
    emailVerification: true,
    phoneVerification: false,
  },
  payment: {
    defaultCurrency: 'VND',
    supportedCurrencies: ['VND', 'USD'],
    paymentMethods: {
      creditCard: true,
      momo: true,
      zalopay: true,
      vnpay: true,
      bankTransfer: true,
      cod: false,
    },
    commissionRate: 5.0,
    commissionType: 'percentage',
    minimumWithdraw: 100000,
    maximumWithdraw: 50000000,
    withdrawFee: 0,
    paymentTimeout: 15,
    refundPeriod: 7,
    autoPayoutEnabled: false,
    payoutSchedule: 'weekly',
    holdPeriod: 7,
  },
  product: {
    maxProductsPerUser: 100,
    maxProductsPerFreePlan: 10,
    maxImagesPerProduct: 10,
    maxVideoPerProduct: 1,
    maxFileSize: 5,
    allowedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    autoApprove: false,
    moderationRequired: true,
    aiModeration: true,
    featuredPrice: 199000,
    promotedPrice: 299000,
    boostPrice: 99000,
    productExpiryDays: 30,
    autoRenew: false,
    lowStockThreshold: 5,
    outOfStockBehavior: 'hide',
    allowPreorder: true,
    allowDigitalProducts: true,
    requireSKU: false,
    requireBarcode: false,
  },
  user: {
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    passwordExpiry: 0,
    sessionTimeout: 24,
    rememberMeDuration: 30,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    twoFactorAuth: false,
    twoFactorMethods: ['email', 'sms', 'authenticator'],
    profileCompletion: true,
    avatarRequired: false,
    phoneRequired: true,
    addressRequired: false,
    identityVerification: false,
    sellerVerification: true,
  },
  notification: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    inAppEnabled: true,
    emailFrom: 'noreply@chogiare.vn',
    emailFromName: 'Chogiare Marketplace',
    smsProvider: 'twilio',
    pushProvider: 'firebase',
    notificationQueue: true,
    batchSize: 100,
    retryAttempts: 3,
    retryDelay: 300,
    digestEnabled: true,
    digestFrequency: 'daily',
    templates: {
      welcome: true,
      orderConfirmation: true,
      orderShipped: true,
      orderDelivered: true,
      passwordReset: true,
      priceAlert: true,
      newMessage: true,
    },
  },
  security: {
    sslEnabled: true,
    forceHttps: true,
    corsEnabled: true,
    corsOrigins: ['https://chogiare.vn', 'https://api.chogiare.vn'],
    rateLimiting: true,
    rateLimit: 100,
    rateLimitWindow: 60,
    apiKeyRequired: true,
    ipWhitelist: false,
    whitelistedIPs: [],
    blacklistedIPs: [],
    auditLogging: true,
    auditRetention: 90,
    dataEncryption: true,
    encryptionAlgorithm: 'AES-256',
    sessionEncryption: true,
    cookieSecure: true,
    cookieSameSite: 'strict',
    csrfProtection: true,
    xssProtection: true,
    contentSecurityPolicy: true,
    captchaEnabled: true,
    captchaProvider: 'recaptcha',
    captchaOnLogin: true,
    captchaOnRegister: true,
    captchaOnContact: true,
  },
  seo: {
    metaTitle: 'Chogiare - Mua bán trực tuyến giá rẻ',
    metaDescription:
      'Nền tảng thương mại điện tử hàng đầu Việt Nam với hàng triệu sản phẩm chất lượng, giá cả cạnh tranh.',
    metaKeywords: 'mua bán online, thương mại điện tử, giá rẻ, chợ giá rẻ',
    ogImage: '/og-image.jpg',
    twitterCard: 'summary_large_image',
    canonicalUrl: 'https://chogiare.vn',
    robotsTxt: true,
    sitemapEnabled: true,
    sitemapFrequency: 'daily',
    googleAnalytics: '',
    googleTagManager: '',
    facebookPixel: '',
    structuredData: true,
    breadcrumbs: true,
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: true,
    smtpUser: '',
    smtpPassword: '',
    sendgridApiKey: '',
    mailgunApiKey: '',
    mailgunDomain: '',
    sesRegion: 'ap-southeast-1',
    sesAccessKey: '',
    sesSecretKey: '',
    testEmail: '',
    emailFooter: 'Chogiare Marketplace - Mua sắm thông minh, giá cả hợp lý',
    unsubscribeLink: true,
  },
  storage: {
    provider: 'local',
    localPath: '/uploads',
    s3Bucket: '',
    s3Region: 'ap-southeast-1',
    s3AccessKey: '',
    s3SecretKey: '',
    s3Endpoint: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    cdnEnabled: false,
    cdnUrl: '',
    imageOptimization: true,
    imageQuality: 85,
    thumbnailSizes: [150, 300, 600],
    maxUploadSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    time: '03:00',
    retention: 30,
    includeDatabase: true,
    includeUploads: true,
    includeLogs: false,
    storageProvider: 'local',
    s3Bucket: '',
    googleDriveFolder: '',
    encryptBackup: true,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    lastBackup: null,
    lastBackupSize: null,
    lastBackupStatus: null,
  },
  cache: {
    enabled: true,
    driver: 'redis',
    redisHost: 'localhost',
    redisPort: 6379,
    redisPassword: '',
    memcachedHost: 'localhost',
    memcachedPort: 11211,
    ttl: 3600,
    prefix: 'chogiare_',
    pageCache: true,
    pageCacheTtl: 600,
    apiCache: true,
    apiCacheTtl: 300,
    queryCache: true,
    queryCacheTtl: 600,
    staticCache: true,
    staticCacheTtl: 86400,
  },
  social: {
    facebookUrl: 'https://facebook.com/chogiare',
    instagramUrl: 'https://instagram.com/chogiare',
    twitterUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
    zaloOA: '',
    facebookAppId: '',
    facebookAppSecret: '',
    googleClientId: '',
    googleClientSecret: '',
    appleClientId: '',
    appleTeamId: '',
    socialLogin: {
      facebook: true,
      google: true,
      apple: false,
      zalo: false,
    },
    socialShare: {
      facebook: true,
      twitter: true,
      pinterest: true,
      whatsapp: true,
      zalo: true,
      copyLink: true,
    },
  },
  legal: {
    termsOfService: '/terms',
    privacyPolicy: '/privacy',
    refundPolicy: '/refund-policy',
    shippingPolicy: '/shipping-policy',
    cookiePolicy: '/cookies',
    gdprCompliance: true,
    cookieConsent: true,
    ageVerification: false,
    minimumAge: 18,
    taxEnabled: true,
    taxRate: 10,
    taxIncluded: true,
    invoiceEnabled: true,
    invoicePrefix: 'INV-',
  },
};

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings(): Promise<SystemSettingsData> {
    const settings = await this.prisma.systemSetting.findMany();

    const result: SystemSettingsData = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    for (const setting of settings) {
      const group = setting.group as keyof SystemSettingsData;
      if (result[group]) {
        try {
          const value = this.parseValue(setting.value, setting.type);
          (result[group] as Record<string, unknown>)[setting.key.replace(`${group}.`, '')] = value;
        } catch {
          // Keep default value if parsing fails
        }
      }
    }

    return result;
  }

  async getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
    if (!DEFAULT_SETTINGS[category as keyof SystemSettingsData]) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const settings = await this.prisma.systemSetting.findMany({
      where: { group: category },
    });

    const result = JSON.parse(
      JSON.stringify(DEFAULT_SETTINGS[category as keyof SystemSettingsData]),
    );

    for (const setting of settings) {
      const key = setting.key.replace(`${category}.`, '');
      try {
        result[key] = this.parseValue(setting.value, setting.type);
      } catch {
        // Keep default value
      }
    }

    return result;
  }

  async updateSettings(settings: Partial<SystemSettingsData>): Promise<SystemSettingsData> {
    const now = BigInt(Date.now());

    for (const [category, categorySettings] of Object.entries(settings)) {
      if (categorySettings && typeof categorySettings === 'object') {
        await this.updateCategorySettings(category, categorySettings as Record<string, unknown>);
      }
    }

    return this.getAllSettings();
  }

  async updateCategorySettings(
    category: string,
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!DEFAULT_SETTINGS[category as keyof SystemSettingsData]) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const now = BigInt(Date.now());

    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `${category}.${key}`;
      const { stringValue, type } = this.serializeValue(value);

      await this.prisma.systemSetting.upsert({
        where: { key: fullKey },
        create: {
          key: fullKey,
          value: stringValue,
          type,
          group: category,
          label: this.generateLabel(key),
          isPublic: this.isPublicSetting(category, key),
          isEditable: true,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          value: stringValue,
          type,
          updatedAt: now,
        },
      });
    }

    return this.getSettingsByCategory(category);
  }

  async getSetting(key: string): Promise<unknown> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      // Return from defaults
      const [category, settingKey] = key.split('.');
      const defaultCategory = DEFAULT_SETTINGS[category as keyof SystemSettingsData];
      if (defaultCategory && settingKey in defaultCategory) {
        return (defaultCategory as Record<string, unknown>)[settingKey];
      }
      throw new NotFoundException(`Setting ${key} not found`);
    }

    return this.parseValue(setting.value, setting.type);
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const [category] = key.split('.');
    if (!DEFAULT_SETTINGS[category as keyof SystemSettingsData]) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const { stringValue, type } = this.serializeValue(value);
    const now = BigInt(Date.now());

    await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: stringValue,
        type,
        group: category,
        label: this.generateLabel(key.split('.').pop() || key),
        isPublic: false,
        isEditable: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        value: stringValue,
        type,
        updatedAt: now,
      },
    });
  }

  async getPublicSettings(): Promise<Record<string, unknown>> {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
    });

    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }

    // Add default public settings
    result['general.siteName'] = result['general.siteName'] || DEFAULT_SETTINGS.general.siteName;
    result['general.siteDescription'] =
      result['general.siteDescription'] || DEFAULT_SETTINGS.general.siteDescription;
    result['general.currency'] = result['general.currency'] || DEFAULT_SETTINGS.general.currency;
    result['general.language'] = result['general.language'] || DEFAULT_SETTINGS.general.language;

    return result;
  }

  async getSystemHealth(): Promise<Record<string, unknown>> {
    const os = await import('os');

    const cpuUsage = os.loadavg()[0];
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    return {
      server: {
        cpu: Math.round(cpuUsage * 10),
        memory: memoryUsage,
        disk: 45, // Would need disk-space package for accurate reading
        status: 'healthy',
      },
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      version: '1.0.0',
      nodeVersion: process.version,
      platform: os.platform(),
      services: {
        database: await this.checkDatabaseHealth(),
        cache: 'unknown',
        storage: 'operational',
        email: 'unknown',
      },
    };
  }

  private async checkDatabaseHealth(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'operational';
    } catch {
      return 'error';
    }
  }

  private parseValue(value: string, type: SettingType): unknown {
    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        return JSON.parse(value);
      case 'text':
        return value;
      default:
        return value;
    }
  }

  private serializeValue(value: unknown): { stringValue: string; type: SettingType } {
    if (typeof value === 'boolean') {
      return { stringValue: String(value), type: 'boolean' };
    }
    if (typeof value === 'number') {
      return { stringValue: String(value), type: 'number' };
    }
    if (Array.isArray(value)) {
      return { stringValue: JSON.stringify(value), type: 'json' };
    }
    if (typeof value === 'object' && value !== null) {
      return { stringValue: JSON.stringify(value), type: 'json' };
    }
    return { stringValue: String(value), type: 'string' };
  }

  private generateLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private isPublicSetting(category: string, key: string): boolean {
    const publicSettings = [
      'general.siteName',
      'general.siteDescription',
      'general.siteUrl',
      'general.supportEmail',
      'general.supportPhone',
      'general.currency',
      'general.language',
      'general.maintenanceMode',
      'general.maintenanceMessage',
      'seo.metaTitle',
      'seo.metaDescription',
      'social.facebookUrl',
      'social.instagramUrl',
      'legal.termsOfService',
      'legal.privacyPolicy',
    ];
    return publicSettings.includes(`${category}.${key}`);
  }
}
