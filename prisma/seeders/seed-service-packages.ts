import { PrismaClient } from '@prisma/client';

/**
 * Seed service packages (premium membership tiers)
 * Vietnamese marketplace pricing: 1 day, 3 days, 5 days, 7 days, 1 month
 */
export async function seedServicePackages(prisma: PrismaClient) {
  console.log('📦 Seeding service packages...');

  const now = Date.now();

  const packages = [
    {
      name: 'goi_1_ngay',
      displayName: 'Gói 1 Ngày',
      description: 'Gói quảng bá ngắn hạn, phù hợp để thử nghiệm hoặc đẩy tin nhanh',
      durationDays: 1,
      price: 30000,
      displayOrder: 1,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
      ]),
      isActive: true,
      metadata: JSON.stringify({
        dailyCost: 30000,
        recommended: false,
        badge: null,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_3_ngay',
      displayName: 'Gói 3 Ngày',
      description: 'Gói phổ biến cho bán hàng cuối tuần hoặc đợt khuyến mãi ngắn',
      durationDays: 3,
      price: 80000,
      displayOrder: 2,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 11% so với mua theo ngày',
      ]),
      isActive: true,
      metadata: JSON.stringify({
        dailyCost: 26667,
        recommended: false,
        badge: null,
        savingsPercent: 11,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_5_ngay',
      displayName: 'Gói 5 Ngày',
      description: 'Gói tối ưu cho chiến dịch bán hàng trong tuần',
      durationDays: 5,
      price: 120000,
      displayOrder: 3,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 20% so với mua theo ngày',
      ]),
      isActive: true,
      metadata: JSON.stringify({
        dailyCost: 24000,
        recommended: false,
        badge: null,
        savingsPercent: 20,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_7_ngay',
      displayName: 'Gói 7 Ngày',
      description: 'Gói đề xuất - Giá trị tốt nhất cho người bán thường xuyên',
      durationDays: 7,
      price: 150000,
      displayOrder: 4,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 29% so với mua theo ngày',
        'Phù hợp cho người bán chuyên nghiệp',
      ]),
      isActive: true,
      metadata: JSON.stringify({
        dailyCost: 21429,
        recommended: true,
        badge: 'BEST_VALUE',
        savingsPercent: 29,
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_1_thang',
      displayName: 'Gói 1 Tháng',
      description: 'Gói dài hạn cho doanh nghiệp và người bán chuyên nghiệp',
      durationDays: 30,
      price: 500000,
      displayOrder: 5,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 44% so với mua theo ngày',
        'Phù hợp cho doanh nghiệp',
        'Cam kết dài hạn - Giá tốt nhất',
      ]),
      isActive: true,
      metadata: JSON.stringify({
        dailyCost: 16667,
        recommended: false,
        badge: 'ENTERPRISE',
        savingsPercent: 44,
      }),
      createdAt: now,
      updatedAt: now,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const pkg of packages) {
    const existing = await prisma.servicePackage.findFirst({
      where: { name: pkg.name },
    });

    if (existing) {
      console.log(`  ⏭️  Package "${pkg.displayName}" already exists, skipping...`);
      skipped++;
      continue;
    }

    await prisma.servicePackage.create({
      data: pkg,
    });

    console.log(
      `  ✅ Created package: ${pkg.displayName} (${pkg.durationDays} ngày - ${pkg.price.toLocaleString('vi-VN')}₫)`,
    );
    created++;
  }

  console.log(`📦 Service packages seeding completed: ${created} created, ${skipped} skipped\n`);
}
