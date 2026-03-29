import { PrismaClient } from '@prisma/client';
import {
  PRODUCT_CONDITION,
  PRODUCT_STATUS,
  PRODUCT_BADGE,
} from '../../src/common/constants/enum.constants';

/**
 * Minimal product seed data (3 products across different categories)
 */
const SEED_PRODUCTS = [
  {
    categorySlug: 'ao-nam',
    title: 'Áo Polo Nam Lacoste Classic Fit',
    description: 'Chất liệu cotton pique cao cấp, thấm hút mồ hôi tốt. Form dáng classic fit thoải mái.',
    price: 450000,
    originalPrice: 650000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'TP. Hồ Chí Minh',
    stock: 20,
    tags: ['thời trang nam', 'áo polo', 'lacoste'],
    badges: [PRODUCT_BADGE.SALE],
    images: 2,
  },
  {
    categorySlug: 'dien-thoai',
    title: 'iPhone 14 Pro Max 256GB Deep Purple',
    description: 'Máy đẹp 99%, pin 95%. Đầy đủ phụ kiện, bảo hành còn 6 tháng.',
    price: 22000000,
    originalPrice: 28000000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'Hà Nội',
    stock: 3,
    tags: ['điện thoại', 'iphone', 'apple'],
    badges: [PRODUCT_BADGE.FEATURED],
    images: 2,
  },
  {
    categorySlug: 'vay-dam',
    title: 'Đầm Công Sở Zara Midi Đen',
    description: 'Đầm midi màu đen thanh lịch, chất liệu polyester cao cấp. Form A tôn dáng.',
    price: 550000,
    originalPrice: null,
    condition: PRODUCT_CONDITION.NEW,
    location: 'TP. Hồ Chí Minh',
    stock: 10,
    tags: ['thời trang nữ', 'đầm', 'công sở'],
    badges: [PRODUCT_BADGE.NEW],
    images: 2,
  },
];

/**
 * Seed products with images (no reviews).
 * Cleans existing product data before seeding.
 */
export async function seedProductsWithRelatedData(
  prisma: PrismaClient,
  users: Record<string, { id: number; email: string }>,
): Promise<void> {
  console.log('🛍️ Seeding products...');

  const seller = users['tringuyen@yopmail.com'];
  if (!seller) {
    console.log('  ⚠️ Seller not found. Skipping products.');
    return;
  }

  // Get categories matching seed data
  const categorySlugs = SEED_PRODUCTS.map((p) => p.categorySlug);
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
  });

  if (categories.length === 0) {
    console.log('  ⚠️ No categories found. Seed categories first.');
    return;
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  const now = BigInt(Date.now());
  let productsCreated = 0;
  let imagesCreated = 0;

  for (const seed of SEED_PRODUCTS) {
    const categoryId = categoryMap.get(seed.categorySlug);
    if (!categoryId) {
      console.log(`  ⚠️ Category "${seed.categorySlug}" not found, skipping`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId,
        title: seed.title,
        description: seed.description,
        price: seed.price,
        originalPrice: seed.originalPrice,
        condition: seed.condition,
        location: seed.location,
        stock: seed.stock,
        availableStock: seed.stock,
        status: PRODUCT_STATUS.ACTIVE,
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        salesCount: 0,
        isFeatured: (seed.badges as number[]).includes(PRODUCT_BADGE.FEATURED),
        isPromoted: false,
        tags: seed.tags,
        badges: seed.badges,
        createdAt: now,
        updatedAt: now,
      },
    });
    productsCreated++;

    // Create placeholder images
    for (let i = 0; i < seed.images; i++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: `https://picsum.photos/seed/${product.id}-${i}/800/600`,
          displayOrder: i,
          createdAt: now,
        },
      });
      imagesCreated++;
    }

    console.log(`  ✓ ${seed.title}`);
  }

  console.log(`  📊 Summary: ${productsCreated} products, ${imagesCreated} images`);
}
