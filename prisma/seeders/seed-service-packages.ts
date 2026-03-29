import { PrismaClient } from '@prisma/client';

/**
 * Minimal service packages: 1 day, 7 days, 1 month
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
      ]),
      isActive: true,
      metadata: JSON.stringify({ dailyCost: 30000, recommended: false, badge: null }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_7_ngay',
      displayName: 'Gói 7 Ngày',
      description: 'Gói đề xuất - Giá trị tốt nhất cho người bán thường xuyên',
      durationDays: 7,
      price: 150000,
      displayOrder: 2,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 29% so với mua theo ngày',
      ]),
      isActive: true,
      metadata: JSON.stringify({ dailyCost: 21429, recommended: true, badge: 'BEST_VALUE', savingsPercent: 29 }),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'goi_1_thang',
      displayName: 'Gói 1 Tháng',
      description: 'Gói dài hạn cho doanh nghiệp và người bán chuyên nghiệp',
      durationDays: 30,
      price: 500000,
      displayOrder: 3,
      features: JSON.stringify([
        'Tin đăng hiển thị ưu tiên',
        'Tăng khả năng tiếp cận người mua',
        'Hỗ trợ khách hàng ưu tiên',
        'Tiết kiệm 44% so với mua theo ngày',
        'Phù hợp cho doanh nghiệp',
      ]),
      isActive: true,
      metadata: JSON.stringify({ dailyCost: 16667, recommended: false, badge: 'ENTERPRISE', savingsPercent: 44 }),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const pkg of packages) {
    await prisma.servicePackage.create({ data: pkg });
    console.log(`  ✓ ${pkg.displayName} (${pkg.durationDays} ngày - ${pkg.price.toLocaleString('vi-VN')}₫)`);
  }

  console.log(`  📊 ${packages.length} service packages created`);
}
