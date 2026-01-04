import { PrismaClient, BoostType, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

// Use Prisma.Decimal for type-safe decimal values
type Decimal = Prisma.Decimal;

/**
 * Interface for package seed data matching BoostPackage schema
 */
interface PackageSeedData {
  id: string;
  name: string;
  type: BoostType;
  price: Decimal;
  description: string;
  config: Record<string, any>;
  isActive: boolean;
  metadata: Record<string, any>;
  createdAt: bigint;
  updatedAt: bigint;
}

/**
 * Generate deterministic short UUID for package ID (10 characters)
 * Uses prefix to ensure uniqueness across different runs
 */
function generatePackageId(prefix: string): string {
  return `${prefix}-${nanoid(6)}`;
}

/**
 * Create 5 payPerView packages with varying view limits and prices
 * Config includes: viewLimit, validityDays, maxProductsPerBoost
 */
function createPayPerViewPackages(): PackageSeedData[] {
  const now = BigInt(Date.now());

  return [
    // Tier 1: Starter Package
    {
      id: generatePackageId('ppv-start'),
      name: 'Gói Khởi Đầu',
      type: BoostType.payPerView,
      price: new Prisma.Decimal(50000),
      description: 'Gói tiếp cận cơ bản dành cho người mới bắt đầu. Phù hợp để thử nghiệm hiệu quả quảng cáo sản phẩm.',
      config: {
        viewLimit: 100,
        validityDays: 30,
        maxProductsPerBoost: 1,
      },
      isActive: true,
      metadata: {
        tier: 'starter',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 2: Standard Package
    {
      id: generatePackageId('ppv-std'),
      name: 'Gói Tiêu Chuẩn',
      type: BoostType.payPerView,
      price: new Prisma.Decimal(200000),
      description: 'Gói tiếp cận phổ biến cho doanh nghiệp nhỏ. Tăng khả năng hiển thị sản phẩm một cách hiệu quả.',
      config: {
        viewLimit: 500,
        validityDays: 60,
        maxProductsPerBoost: 3,
      },
      isActive: true,
      metadata: {
        tier: 'standard',
        recommended: true,
        popular: true,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 3: Professional Package
    {
      id: generatePackageId('ppv-pro'),
      name: 'Gói Chuyên Nghiệp',
      type: BoostType.payPerView,
      price: new Prisma.Decimal(500000),
      description: 'Gói tiếp cận mạnh mẽ cho tăng trưởng nhanh. Đầu tư hiệu quả cho các chiến dịch marketing quy mô vừa.',
      config: {
        viewLimit: 1500,
        validityDays: 90,
        maxProductsPerBoost: 5,
      },
      isActive: true,
      metadata: {
        tier: 'professional',
        recommended: false,
        popular: true,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 4: Enterprise Package
    {
      id: generatePackageId('ppv-ent'),
      name: 'Gói Doanh Nghiệp',
      type: BoostType.payPerView,
      price: new Prisma.Decimal(1500000),
      description: 'Gói tiếp cận quy mô lớn dành cho doanh nghiệp. Tối ưu hóa hiển thị cho nhiều sản phẩm đồng thời.',
      config: {
        viewLimit: 5000,
        validityDays: 180,
        maxProductsPerBoost: 10,
      },
      isActive: true,
      metadata: {
        tier: 'enterprise',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 5: Premium Package
    {
      id: generatePackageId('ppv-prem'),
      name: 'Gói Cao Cấp',
      type: BoostType.payPerView,
      price: new Prisma.Decimal(2500000),
      description: 'Gói tiếp cận cao cấp không giới hạn. Giải pháp tối ưu cho các chiến dịch marketing quy mô lớn và dài hạn.',
      config: {
        viewLimit: 10000,
        validityDays: 365,
        maxProductsPerBoost: 20,
      },
      isActive: true,
      metadata: {
        tier: 'premium',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Create 5 payPerDay packages with varying durations and prices
 * Config includes: durationDays, maxProducts, priority
 */
function createPayPerDayPackages(): PackageSeedData[] {
  const now = BigInt(Date.now());

  return [
    // Tier 1: 7 Days Package
    {
      id: generatePackageId('ppd-7day'),
      name: 'Gói 7 Ngày',
      type: BoostType.payPerDay,
      price: new Prisma.Decimal(100000),
      description: 'Gói đẩy tin ngắn hạn trong 7 ngày. Phù hợp để test hiệu quả hoặc quảng bá sản phẩm theo sự kiện.',
      config: {
        durationDays: 7,
        maxProducts: 1,
        priority: 3,
      },
      isActive: true,
      metadata: {
        tier: 'starter',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 2: 15 Days Package
    {
      id: generatePackageId('ppd-15day'),
      name: 'Gói 15 Ngày',
      type: BoostType.payPerDay,
      price: new Prisma.Decimal(250000),
      description: 'Gói đẩy tin trung bình phổ biến 15 ngày. Cân bằng tốt giữa chi phí và thời gian quảng bá.',
      config: {
        durationDays: 15,
        maxProducts: 3,
        priority: 5,
      },
      isActive: true,
      metadata: {
        tier: 'standard',
        recommended: true,
        popular: true,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 3: 30 Days Package
    {
      id: generatePackageId('ppd-30day'),
      name: 'Gói 30 Ngày',
      type: BoostType.payPerDay,
      price: new Prisma.Decimal(450000),
      description: 'Gói đẩy tin dài hạn hiệu quả trong 30 ngày. Tối ưu cho chiến dịch marketing dài hơi.',
      config: {
        durationDays: 30,
        maxProducts: 5,
        priority: 7,
      },
      isActive: true,
      metadata: {
        tier: 'professional',
        recommended: false,
        popular: true,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 4: 60 Days Package
    {
      id: generatePackageId('ppd-60day'),
      name: 'Gói 60 Ngày',
      type: BoostType.payPerDay,
      price: new Prisma.Decimal(800000),
      description: 'Gói đẩy tin quy mô lớn trong 60 ngày. Dành cho doanh nghiệp cần quảng bá nhiều sản phẩm.',
      config: {
        durationDays: 60,
        maxProducts: 10,
        priority: 8,
      },
      isActive: true,
      metadata: {
        tier: 'enterprise',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },

    // Tier 5: 90 Days Package
    {
      id: generatePackageId('ppd-90day'),
      name: 'Gói 90 Ngày',
      type: BoostType.payPerDay,
      price: new Prisma.Decimal(1200000),
      description: 'Gói đẩy tin cao cấp 90 ngày với ưu tiên hiển thị tối đa. Giải pháp toàn diện cho doanh nghiệp lớn.',
      config: {
        durationDays: 90,
        maxProducts: 20,
        priority: 10,
      },
      isActive: true,
      metadata: {
        tier: 'premium',
        recommended: false,
        popular: false,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Main seeder function to populate BoostPackage table
 * Uses upsert to ensure idempotency (can be run multiple times safely)
 */
export async function seedBoostPackages(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding boost packages...');

  try {
    const payPerViewPackages = createPayPerViewPackages();
    const payPerDayPackages = createPayPerDayPackages();
    const allPackages = [...payPerViewPackages, ...payPerDayPackages];

    // Upsert each package (create if not exists, update if exists)
    for (const packageData of allPackages) {
      await prisma.boostPackage.upsert({
        where: { id: packageData.id },
        update: {
          name: packageData.name,
          type: packageData.type,
          price: packageData.price,
          description: packageData.description,
          config: packageData.config,
          isActive: packageData.isActive,
          metadata: packageData.metadata,
          updatedAt: packageData.updatedAt,
        },
        create: packageData,
      });

      console.log(`  ✓ ${packageData.type}: ${packageData.name} (${packageData.price} VND)`);
    }

    console.log(`✅ Successfully seeded ${allPackages.length} boost packages`);
    console.log(`   - ${payPerViewPackages.length} payPerView packages`);
    console.log(`   - ${payPerDayPackages.length} payPerDay packages`);
  } catch (error) {
    console.error('❌ Failed to seed boost packages:', error);
    throw error;
  }
}
