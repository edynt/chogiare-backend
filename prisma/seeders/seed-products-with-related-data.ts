import { PrismaClient } from '@prisma/client';
import {
  PRODUCT_CONDITION,
  PRODUCT_STATUS,
  PRODUCT_BADGE,
} from '../../src/common/constants/enum.constants';

/**
 * Small set of realistic product seed data
 * Each product maps to a category slug
 */
const SEED_PRODUCTS = [
  {
    categorySlug: 'ao-nam',
    title: 'Áo Polo Nam Lacoste Classic Fit',
    description: 'Chất liệu cotton pique cao cấp, thấm hút mồ hôi tốt. Form dáng classic fit thoải mái. Logo thêu tinh xảo.',
    price: 450000,
    originalPrice: 650000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'TP. Hồ Chí Minh',
    stock: 20,
    tags: ['thời trang nam', 'áo polo', 'lacoste'],
    badges: [PRODUCT_BADGE.SALE],
    images: 3,
  },
  {
    categorySlug: 'giay-nam',
    title: 'Giày Sneaker Nike Air Force 1 White',
    description: 'Giày Nike AF1 trắng nguyên bản. Đế Air êm ái, da tổng hợp bền đẹp. Size 42, mới 99%.',
    price: 1800000,
    originalPrice: 2500000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'Hà Nội',
    stock: 5,
    tags: ['giày nam', 'sneaker', 'nike'],
    badges: [PRODUCT_BADGE.HOT, PRODUCT_BADGE.SALE],
    images: 4,
  },
  {
    categorySlug: 'dien-thoai',
    title: 'iPhone 14 Pro Max 256GB Deep Purple',
    description: 'Máy đẹp 99%, pin 95%. Đầy đủ phụ kiện, bảo hành còn 6 tháng. Camera 48MP, chip A16 Bionic.',
    price: 22000000,
    originalPrice: 28000000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'TP. Hồ Chí Minh',
    stock: 3,
    tags: ['điện thoại', 'iphone', 'apple'],
    badges: [PRODUCT_BADGE.FEATURED],
    images: 5,
  },
  {
    categorySlug: 'laptop',
    title: 'MacBook Air M2 2022 8GB/256GB Midnight',
    description: 'MacBook Air M2 màu Midnight, sử dụng 6 tháng. Pin cycle count 45. Fullbox, bảo hành Apple Care+.',
    price: 18500000,
    originalPrice: 27990000,
    condition: PRODUCT_CONDITION.LIKE_NEW,
    location: 'Đà Nẵng',
    stock: 2,
    tags: ['laptop', 'macbook', 'apple'],
    badges: [PRODUCT_BADGE.FEATURED, PRODUCT_BADGE.SALE],
    images: 4,
  },
  {
    categorySlug: 'vay-dam',
    title: 'Đầm Công Sở Zara Midi Đen',
    description: 'Đầm midi màu đen thanh lịch, chất liệu polyester cao cấp. Form A tôn dáng, phù hợp đi làm và sự kiện.',
    price: 550000,
    originalPrice: null,
    condition: PRODUCT_CONDITION.NEW,
    location: 'TP. Hồ Chí Minh',
    stock: 10,
    tags: ['thời trang nữ', 'đầm', 'công sở'],
    badges: [PRODUCT_BADGE.NEW],
    images: 3,
  },
  {
    categorySlug: 'cham-soc-da',
    title: 'Serum La Roche-Posay Vitamin C 30ml',
    description: 'Serum dưỡng sáng da, chống oxy hóa. Hàng chính hãng, date mới, còn nguyên seal. Phù hợp mọi loại da.',
    price: 680000,
    originalPrice: 850000,
    condition: PRODUCT_CONDITION.NEW,
    location: 'Hà Nội',
    stock: 15,
    tags: ['skincare', 'serum', 'chăm sóc da'],
    badges: [PRODUCT_BADGE.NEW, PRODUCT_BADGE.SALE],
    images: 2,
  },
];

/**
 * Seed a small set of realistic products with images
 * All products belong to seller (tringuyen@yopmail.com)
 */
export async function seedProductsWithRelatedData(
  prisma: PrismaClient,
  users: Record<string, { id: number; email: string }>,
): Promise<void> {
  console.log('🛍️ Seeding products...');

  const seller = users['tringuyen@yopmail.com'];
  const buyer = users['edyn@yopmail.com'];

  if (!seller) {
    console.log('  ⚠️ Seller user not found. Skipping products.');
    return;
  }

  console.log(`  👤 Seller: ${seller.email} (id: ${seller.id})`);

  // Get categories matching seed data
  const categorySlugs = Array.from(new Set(SEED_PRODUCTS.map((p) => p.categorySlug)));
  const categories = await prisma.category.findMany({
    where: { slug: { in: categorySlugs } },
  });

  if (categories.length === 0) {
    console.log('  ⚠️ No categories found. Please seed categories first.');
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

    // Create product
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

  // Add reviews from buyer to multiple products and update product stats
  if (buyer) {
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'asc' },
    });

    const sampleReviews = [
      { rating: 5, title: 'Sản phẩm tốt', comment: 'Hàng đúng mô tả, giao hàng nhanh. Rất hài lòng!' },
      { rating: 4, title: 'Chất lượng ổn', comment: 'Sản phẩm tốt so với giá tiền. Đóng gói cẩn thận.' },
      { rating: 5, title: 'Xuất sắc', comment: 'Mình rất hài lòng, sẽ ủng hộ lần sau. Giao hàng nhanh, đúng mô tả.' },
      { rating: 3, title: 'Tạm được', comment: 'Sản phẩm OK nhưng giao hàng hơi chậm.' },
      { rating: 4, title: 'Đáng mua', comment: 'Giá hợp lý, chất lượng tương xứng. Recommend cho mọi người.' },
    ];

    let reviewsCreated = 0;
    for (let i = 0; i < Math.min(sellerProducts.length, sampleReviews.length); i++) {
      const product = sellerProducts[i];
      const review = sampleReviews[i];
      try {
        await prisma.review.create({
          data: {
            productId: product.id,
            userId: buyer.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            isVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        });

        // Update product rating and reviewCount
        await prisma.product.update({
          where: { id: product.id },
          data: { rating: review.rating, reviewCount: 1 },
        });

        reviewsCreated++;
      } catch {
        // Skip if duplicate
      }
    }

    console.log(`  ✓ ${reviewsCreated} reviews created`);
  }

  console.log(`\n  📊 Summary: ${productsCreated} products, ${imagesCreated} images`);
}
