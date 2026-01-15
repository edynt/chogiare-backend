import { PrismaClient, ProductCondition, ProductStatus, ProductBadge } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/vi';

/**
 * Product template by category
 */
interface ProductTemplate {
  titlePrefix: string;
  brands: string[];
  priceRange: { min: number; max: number };
  descriptions: string[];
  tags: string[];
  condition: ProductCondition[];
}

/**
 * Product templates organized by category slug
 */
const PRODUCT_TEMPLATES: Record<string, ProductTemplate> = {
  // Thời trang nam
  'ao-nam': {
    titlePrefix: 'Áo',
    brands: ['Polo', 'Lacoste', 'Nike', 'Adidas', 'Uniqlo', 'H&M', 'Zara', 'Routine', 'Coolmate'],
    priceRange: { min: 150000, max: 800000 },
    descriptions: [
      'Chất liệu cotton cao cấp, thấm hút mồ hôi tốt',
      'Thiết kế trẻ trung, năng động, phù hợp nhiều dịp',
      'Form dáng regular fit, thoải mái khi vận động',
      'Dễ dàng phối đồ với nhiều trang phục khác nhau',
    ],
    tags: ['thời trang nam', 'áo thun', 'áo sơ mi', 'áo khoác', 'cotton'],
    condition: ['new', 'like_new', 'good'],
  },
  'quan-nam': {
    titlePrefix: 'Quần',
    brands: ['Levi\'s', 'Dockers', 'Uniqlo', 'H&M', 'Zara', 'ASOS', 'Topman'],
    priceRange: { min: 200000, max: 1200000 },
    descriptions: [
      'Chất liệu bền bỉ, giữ form tốt sau nhiều lần giặt',
      'Thiết kế hiện đại, phong cách trẻ trung',
      'Thoải mái, dễ dàng vận động cả ngày',
      'Có nhiều màu sắc để lựa chọn',
    ],
    tags: ['thời trang nam', 'quần jean', 'quần kaki', 'quần short'],
    condition: ['new', 'like_new', 'good'],
  },
  'giay-nam': {
    titlePrefix: 'Giày',
    brands: ['Nike', 'Adidas', 'Converse', 'Vans', 'Puma', 'New Balance', 'Fila', 'Biti\'s Hunter'],
    priceRange: { min: 300000, max: 3000000 },
    descriptions: [
      'Đế giày êm ái, hỗ trợ tốt khi di chuyển',
      'Thiết kế thời trang, dễ phối đồ',
      'Chất liệu cao cấp, bền đẹp theo thời gian',
      'Phù hợp cho cả đi làm và đi chơi',
    ],
    tags: ['giày nam', 'giày thể thao', 'giày da', 'sneaker'],
    condition: ['new', 'like_new'],
  },

  // Thời trang nữ
  'ao-nu': {
    titlePrefix: 'Áo',
    brands: ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Canifa', 'IVY moda', 'Elise'],
    priceRange: { min: 150000, max: 900000 },
    descriptions: [
      'Thiết kế nữ tính, thanh lịch',
      'Chất liệu mềm mại, thoáng mát',
      'Dễ dàng mix-match với nhiều trang phục',
      'Phù hợp cho cả đi làm và đi chơi',
    ],
    tags: ['thời trang nữ', 'áo kiểu', 'áo thun', 'áo sơ mi'],
    condition: ['new', 'like_new', 'good'],
  },
  'quan-nu': {
    titlePrefix: 'Quần',
    brands: ['Zara', 'H&M', 'Mango', 'Uniqlo', 'Canifa', 'IVY moda'],
    priceRange: { min: 200000, max: 1000000 },
    descriptions: [
      'Form dáng đẹp,ôm dáng vừa vặn',
      'Chất liệu co giãn tốt, thoải mái',
      'Thiết kế hiện đại, thời trang',
      'Dễ phối với nhiều loại áo',
    ],
    tags: ['thời trang nữ', 'quần jean', 'quần tây', 'quần short'],
    condition: ['new', 'like_new', 'good'],
  },
  'vay-dam': {
    titlePrefix: 'Váy/Đầm',
    brands: ['Zara', 'H&M', 'Mango', 'IVY moda', 'Elise', 'Bella'],
    priceRange: { min: 250000, max: 1500000 },
    descriptions: [
      'Thiết kế sang trọng, nữ tính',
      'Chất liệu cao cấp, mặc thoải mái',
      'Phù hợp cho nhiều dịp khác nhau',
      'Form dáng tôn dáng, che khuyết điểm tốt',
    ],
    tags: ['thời trang nữ', 'váy', 'đầm', 'đầm công sở'],
    condition: ['new', 'like_new'],
  },

  // Điện tử
  'dien-thoai': {
    titlePrefix: 'Điện thoại',
    brands: ['iPhone', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Realme', 'Nokia'],
    priceRange: { min: 2000000, max: 30000000 },
    descriptions: [
      'Hiệu năng mạnh mẽ, đa nhiệm mượt mà',
      'Camera chất lượng cao, chụp ảnh đẹp',
      'Pin trâu, sử dụng cả ngày',
      'Bảo hành chính hãng, đầy đủ phụ kiện',
    ],
    tags: ['điện thoại', 'smartphone', 'di động', 'chính hãng'],
    condition: ['new', 'like_new'],
  },
  'may-tinh-bang': {
    titlePrefix: 'Máy tính bảng',
    brands: ['iPad', 'Samsung Galaxy Tab', 'Xiaomi Pad', 'Huawei MatePad'],
    priceRange: { min: 3000000, max: 25000000 },
    descriptions: [
      'Màn hình lớn, hiển thị sắc nét',
      'Hiệu năng cao, xử lý mượt mà',
      'Pin lâu, sử dụng cả ngày',
      'Phù hợp cho học tập và giải trí',
    ],
    tags: ['máy tính bảng', 'tablet', 'iPad', 'Android'],
    condition: ['new', 'like_new'],
  },
  'laptop': {
    titlePrefix: 'Laptop',
    brands: ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'MacBook'],
    priceRange: { min: 8000000, max: 45000000 },
    descriptions: [
      'Cấu hình mạnh mẽ, xử lý đa tác vụ tốt',
      'Thiết kế sang trọng, nhẹ, mỏng',
      'Pin trâu, sử dụng liên tục nhiều giờ',
      'Bảo hành chính hãng, hỗ trợ tốt',
    ],
    tags: ['laptop', 'máy tính', 'gaming', 'văn phòng'],
    condition: ['new', 'like_new'],
  },

  // Đồ gia dụng
  'do-dung-nha-bep': {
    titlePrefix: 'Đồ dùng nhà bếp',
    brands: ['Lock&Lock', 'Tupperware', 'Inox 304', 'Tefal', 'Elmich'],
    priceRange: { min: 50000, max: 500000 },
    descriptions: [
      'Chất liệu an toàn, không độc hại',
      'Bền bỉ, sử dụng lâu dài',
      'Dễ dàng vệ sinh, bảo quản',
      'Thiết kế tiện lợi, tiết kiệm không gian',
    ],
    tags: ['nhà bếp', 'đồ dùng', 'nấu ăn', 'inox'],
    condition: ['new', 'like_new', 'good'],
  },
  'thiet-bi-nha-bep': {
    titlePrefix: 'Thiết bị nhà bếp',
    brands: ['Panasonic', 'Philips', 'Sharp', 'Sunhouse', 'Kangaroo', 'Midea'],
    priceRange: { min: 500000, max: 8000000 },
    descriptions: [
      'Công suất mạnh, tiết kiệm điện',
      'Dễ dàng sử dụng, vận hành êm ái',
      'Bảo hành chính hãng, hỗ trợ tốt',
      'Thiết kế hiện đại, sang trọng',
    ],
    tags: ['thiết bị nhà bếp', 'điện lạnh', 'gia dụng'],
    condition: ['new', 'like_new'],
  },

  // Sức khỏe & làm đẹp
  'my-pham': {
    titlePrefix: 'Mỹ phẩm',
    brands: ['MAC', '3CE', 'Maybelline', 'L\'Oreal', 'Innisfree', 'The Face Shop', 'Cocoon'],
    priceRange: { min: 100000, max: 2000000 },
    descriptions: [
      'Thành phần lành tính, an toàn cho da',
      'Màu sắc đẹp, lên màu chuẩn',
      'Lâu trôi, giữ màu tốt cả ngày',
      'Hàng chính hãng, tem phụ đầy đủ',
    ],
    tags: ['mỹ phẩm', 'làm đẹp', 'son', 'phấn'],
    condition: ['new'],
  },
  'cham-soc-da': {
    titlePrefix: 'Sản phẩm chăm sóc da',
    brands: ['Cetaphil', 'La Roche-Posay', 'Innisfree', 'Some By Mi', 'Cocoon', 'Garnier'],
    priceRange: { min: 150000, max: 1500000 },
    descriptions: [
      'Dưỡng ẩm sâu, làm mềm da',
      'Thành phần tự nhiên, lành tính',
      'Phù hợp cho mọi loại da',
      'Hấp thụ nhanh, không gây bết dính',
    ],
    tags: ['chăm sóc da', 'skincare', 'dưỡng da'],
    condition: ['new'],
  },

  // Thể thao
  'do-the-thao': {
    titlePrefix: 'Đồ thể thao',
    brands: ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Lululemon', 'Decathlon'],
    priceRange: { min: 200000, max: 1500000 },
    descriptions: [
      'Chất liệu thông thoáng, thấm hút mồ hôi',
      'Co giãn 4 chiều, thoải mái vận động',
      'Thiết kế năng động, thể thao',
      'Bền bỉ, giữ form sau nhiều lần giặt',
    ],
    tags: ['thể thao', 'gym', 'running', 'fitness'],
    condition: ['new', 'like_new'],
  },

  // Trẻ em
  'do-choi': {
    titlePrefix: 'Đồ chơi',
    brands: ['LEGO', 'Disney', 'Playmobil', 'Fisher-Price', 'VTech'],
    priceRange: { min: 100000, max: 3000000 },
    descriptions: [
      'An toàn cho trẻ, không chứa chất độc hại',
      'Kích thích trí tưởng tượng và sáng tạo',
      'Chất lượng tốt, bền bỉ',
      'Phù hợp với lứa tuổi, giáo dục',
    ],
    tags: ['đồ chơi', 'trẻ em', 'giáo dục'],
    condition: ['new', 'like_new'],
  },
  'quan-ao-tre-em': {
    titlePrefix: 'Quần áo trẻ em',
    brands: ['Carter\'s', 'Uniqlo Kids', 'H&M Kids', 'Zara Kids', 'Canifa Kids'],
    priceRange: { min: 100000, max: 500000 },
    descriptions: [
      'Chất liệu cotton mềm mại, an toàn',
      'Thiết kế dễ thương, đáng yêu',
      'Thoải mái cho bé vận động',
      'Dễ giặt, mau khô',
    ],
    tags: ['quần áo trẻ em', 'bé trai', 'bé gái'],
    condition: ['new', 'like_new'],
  },

  // Sách
  'sach': {
    titlePrefix: 'Sách',
    brands: ['NXB Trẻ', 'NXB Kim Đồng', 'NXB Văn học', 'NXB Lao Động', 'First News'],
    priceRange: { min: 50000, max: 300000 },
    descriptions: [
      'Nội dung hay, bổ ích',
      'In ấn đẹp, giấy tốt',
      'Sách mới, còn nguyên seal',
      'Giao hàng cẩn thận, đóng gói kỹ',
    ],
    tags: ['sách', 'văn học', 'kỹ năng', 'kiến thức'],
    condition: ['new', 'like_new'],
  },
  'van-phong-pham': {
    titlePrefix: 'Văn phòng phẩm',
    brands: ['Thiên Long', 'BIC', 'Staedtler', 'Pentel', 'Deli'],
    priceRange: { min: 10000, max: 200000 },
    descriptions: [
      'Chất lượng tốt, bền bỉ',
      'Dễ sử dụng, tiện lợi',
      'Giá cả phải chăng',
      'Phù hợp cho học sinh, sinh viên, văn phòng',
    ],
    tags: ['văn phòng phẩm', 'bút', 'vở', 'học tập'],
    condition: ['new'],
  },
};

/**
 * Product name variations
 */
const PRODUCT_NAMES: Record<string, string[]> = {
  'ao-nam': ['Thun Nam', 'Sơ Mi Nam', 'Polo Nam', 'Khoác Nam', 'Hoodie Nam', 'Len Nam'],
  'quan-nam': ['Jean Nam', 'Kaki Nam', 'Short Nam', 'Tây Nam', 'Thể Thao Nam'],
  'giay-nam': ['Sneaker Nam', 'Giày Da Nam', 'Dép Nam', 'Giày Thể Thao Nam', 'Giày Tây Nam'],
  'ao-nu': ['Thun Nữ', 'Sơ Mi Nữ', 'Kiểu Nữ', 'Khoác Nữ', 'Len Nữ'],
  'quan-nu': ['Jean Nữ', 'Tây Nữ', 'Short Nữ', 'Legging Nữ', 'Culottes'],
  'vay-dam': ['Váy Midi', 'Đầm Công Sở', 'Váy Maxi', 'Đầm Dự Tiệc', 'Váy Xòe'],
  'dien-thoai': ['11 Pro Max', 'Galaxy S21', 'Redmi Note 11', 'OPPO Reno', 'Vivo V21'],
  'may-tinh-bang': ['Pro 11', 'Galaxy Tab S8', 'Pad 5', 'MatePad Pro'],
  'laptop': ['Latitude', 'ThinkPad', 'VivoBook', 'Aspire', 'MacBook Air', 'Pavilion'],
  'do-dung-nha-bep': ['Nồi Inox', 'Chảo Chống Dính', 'Bộ Dao', 'Thớt Gỗ', 'Hộp Đựng'],
  'thiet-bi-nha-bep': ['Nồi Cơm Điện', 'Lò Vi Sóng', 'Máy Xay', 'Bếp Điện', 'Ấm Siêu Tốc'],
  'my-pham': ['Son Thỏi', 'Phấn Nước', 'Mascara', 'Kem Nền', 'Má Hồng'],
  'cham-soc-da': ['Sữa Rửa Mặt', 'Kem Dưỡng', 'Serum', 'Toner', 'Mặt Nạ'],
  'do-the-thao': ['Quần Short Thể Thao', 'Áo Tập Gym', 'Quần Legging', 'Bộ Đồ Tập'],
  'do-choi': ['Bộ Lego', 'Búp Bê', 'Xe Điều Khiển', 'Robot', 'Xếp Hình'],
  'quan-ao-tre-em': ['Bộ Đồ Bé Trai', 'Váy Bé Gái', 'Áo Thun Trẻ Em', 'Quần Short Bé'],
  'sach': ['Văn Học', 'Kỹ Năng Sống', 'Tiểu Thuyết', 'Sách Thiếu Nhi', 'Sách Kinh Tế'],
  'van-phong-pham': ['Bút Bi', 'Vở Kẻ Ngang', 'Bút Chì', 'Tẩy', 'Thước Kẻ'],
};

/**
 * Generate random product data based on category
 */
function generateProductData(
  categorySlug: string,
  categoryId: number,
  sellerId: number,
  storeId: number | null,
): any {
  const template = PRODUCT_TEMPLATES[categorySlug];
  const names = PRODUCT_NAMES[categorySlug];

  if (!template || !names) {
    return null;
  }

  const brand = faker.helpers.arrayElement(template.brands);
  const productName = faker.helpers.arrayElement(names);
  const title = `${template.titlePrefix} ${productName} ${brand}`;

  const price = faker.number.int(template.priceRange);
  const originalPrice = faker.datatype.boolean(0.3) ? price * faker.number.float({ min: 1.1, max: 1.5 }) : null;
  const condition = faker.helpers.arrayElement(template.condition);
  const stock = faker.number.int({ min: 10, max: 500 });

  // Generate badges
  const badges: ProductBadge[] = [];
  if (faker.datatype.boolean(0.1)) badges.push('NEW');
  if (faker.datatype.boolean(0.1)) badges.push('FEATURED');
  if (faker.datatype.boolean(0.1)) badges.push('HOT');
  if (originalPrice && faker.datatype.boolean(0.3)) badges.push('SALE');

  const now = BigInt(Date.now());

  return {
    sellerId,
    storeId,
    categoryId,
    title,
    description: template.descriptions.join('. ') + '.',
    price,
    originalPrice,
    condition,
    location: faker.location.city(),
    stock,
    availableStock: stock,
    status: faker.helpers.arrayElement<ProductStatus>(['active', 'active', 'active', 'draft']),
    rating: faker.number.float({ min: 3.5, max: 5, multipleOf: 0.1 }),
    reviewCount: faker.number.int({ min: 0, max: 200 }),
    viewCount: faker.number.int({ min: 0, max: 5000 }),
    salesCount: faker.number.int({ min: 0, max: 500 }),
    isFeatured: faker.datatype.boolean(0.1),
    isPromoted: faker.datatype.boolean(0.15),
    tags: faker.helpers.arrayElements(template.tags, { min: 2, max: 4 }),
    badges,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Seed users (sellers) for products
 */
async function seedSellers(prisma: PrismaClient, count: number) {
  console.log(`👥 Seeding ${count} sellers...`);

  const now = BigInt(Date.now());
  const sellers = [];

  for (let i = 0; i < count; i++) {
    const email = faker.internet.email();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      const seller = await prisma.user.create({
        data: {
          email,
          hashedPassword: '$2b$10$dummy.hash.for.seeding.purposes.only',
          isVerified: true,
          status: true,
          language: 'vi',
          fullName: faker.person.fullName(),
          phoneNumber: faker.phone.number(),
          address: faker.location.streetAddress(),
          country: 'Vietnam',
          createdAt: now,
          updatedAt: now,
        },
      });
      sellers.push(seller);
    }
  }

  console.log(`  ✓ Created ${sellers.length} sellers`);
  return sellers;
}

/**
 * Seed stores
 */
async function seedStores(prisma: PrismaClient, sellers: any[]) {
  console.log(`🏪 Seeding ${sellers.length} stores...`);

  const now = BigInt(Date.now());
  const stores = [];

  for (const seller of sellers) {
    const storeName = faker.company.name();
    const slug = faker.helpers.slugify(storeName).toLowerCase() + '-' + faker.number.int({ min: 1000, max: 9999 });

    const store = await prisma.store.create({
      data: {
        userId: seller.id,
        name: storeName,
        slug,
        description: faker.company.catchPhrase(),
        shortDescription: faker.lorem.sentence(),
        rating: faker.number.float({ min: 3.5, max: 5, multipleOf: 0.1 }),
        reviewCount: faker.number.int({ min: 0, max: 500 }),
        isVerified: faker.datatype.boolean(0.5),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    stores.push(store);
  }

  console.log(`  ✓ Created ${stores.length} stores`);
  return stores;
}

/**
 * Seed products with related data
 */
export async function seedProductsWithRelatedData(prisma: PrismaClient): Promise<void> {
  console.log('🛍️ Seeding products with related data...');

  const TARGET_PRODUCTS = 300;
  const SELLERS_COUNT = 20;

  try {
    // Get all categories (excluding parents without specific templates)
    const categories = await prisma.category.findMany({
      where: {
        slug: {
          in: Object.keys(PRODUCT_TEMPLATES),
        },
      },
    });

    if (categories.length === 0) {
      console.log('  ⚠️  No categories found. Please seed categories first.');
      return;
    }

    console.log(`  📋 Found ${categories.length} categories`);

    // Seed sellers
    const sellers = await seedSellers(prisma, SELLERS_COUNT);
    if (sellers.length === 0) {
      console.log('  ⚠️  No sellers created');
      return;
    }

    // Seed stores
    const stores = await seedStores(prisma, sellers);

    // Calculate products per category
    const productsPerCategory = Math.floor(TARGET_PRODUCTS / categories.length);
    let totalCreated = 0;

    // Seed products
    console.log(`📦 Seeding products (${productsPerCategory} per category)...`);

    for (const category of categories) {
      const productsInCategory = [];

      for (let i = 0; i < productsPerCategory; i++) {
        const seller = faker.helpers.arrayElement(sellers);
        const store = stores.find((s) => s.userId === seller.id);

        const productData = generateProductData(category.slug, category.id, seller.id, store?.id || null);

        if (productData) {
          productsInCategory.push(productData);
        }
      }

      // Bulk create products for this category
      if (productsInCategory.length > 0) {
        await prisma.product.createMany({
          data: productsInCategory,
          skipDuplicates: true,
        });

        totalCreated += productsInCategory.length;
        console.log(`  ✓ Created ${productsInCategory.length} products for "${category.name}"`);
      }
    }

    // Get all created products for adding images and reviews
    const products = await prisma.product.findMany({
      take: TARGET_PRODUCTS,
      orderBy: { createdAt: 'desc' },
    });

    // Seed product images
    console.log(`🖼️  Seeding product images...`);
    const now = BigInt(Date.now());
    let imagesCreated = 0;

    for (const product of products) {
      const imageCount = faker.number.int({ min: 2, max: 5 });

      for (let i = 0; i < imageCount; i++) {
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
    }

    console.log(`  ✓ Created ${imagesCreated} product images`);

    // Seed reviews
    console.log(`⭐ Seeding product reviews...`);
    let reviewsCreated = 0;

    // Get some users for reviews (reuse sellers as reviewers)
    const reviewers = sellers.slice(0, 10);

    for (const product of products) {
      // Random number of reviews per product
      const reviewCount = faker.number.int({ min: 0, max: 5 });

      for (let i = 0; i < reviewCount; i++) {
        const reviewer = faker.helpers.arrayElement(reviewers);

        try {
          await prisma.review.create({
            data: {
              productId: product.id,
              userId: reviewer.id,
              rating: faker.number.int({ min: 3, max: 5 }),
              title: faker.lorem.sentence(),
              comment: faker.lorem.paragraph(),
              isVerified: faker.datatype.boolean(0.7),
              createdAt: now,
              updatedAt: now,
            },
          });
          reviewsCreated++;
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    console.log(`  ✓ Created ${reviewsCreated} reviews`);

    console.log(`\n  📊 Summary:`);
    console.log(`     - ${sellers.length} sellers created`);
    console.log(`     - ${stores.length} stores created`);
    console.log(`     - ${totalCreated} products created`);
    console.log(`     - ${imagesCreated} product images created`);
    console.log(`     - ${reviewsCreated} reviews created`);
  } catch (error) {
    console.error('  ❌ Error seeding products:', error);
    throw error;
  }
}
