import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seeder để tạo dữ liệu mẫu cho Stores và Products
 * Chạy: npm run seed:products-stores hoặc ts-node prisma/seed-products-stores.ts
 */
async function seedProductsAndStores() {
  console.log('🌱 Starting products and stores seeder...');

  try {
    // Đảm bảo có seller user
    console.log('Checking seller user...');
    const sellerPassword = await bcrypt.hash('seller123', 10);
    const sellerUser = await prisma.user.upsert({
      where: { email: 'seller@chogiare.com' },
      update: {},
      create: {
        email: 'seller@chogiare.com',
        username: 'seller',
        hashedPassword: sellerPassword,
        isVerified: true,
        status: true,
        language: 'vi',
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });

    // Tạo seller role và gán
    const sellerRole = await prisma.role.upsert({
      where: { name: 'seller' },
      update: {},
      create: {
        name: 'seller',
        description: 'Người bán hàng',
        createdAt: BigInt(Date.now()),
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: sellerUser.id,
          roleId: sellerRole.id,
        },
      },
      update: {},
      create: {
        userId: sellerUser.id,
        roleId: sellerRole.id,
      },
    });

    // Đảm bảo có categories
    console.log('Creating categories...');
    const electronicsCategory = await prisma.category.upsert({
      where: { slug: 'dien-tu' },
      update: {},
      create: {
        name: 'Điện Tử',
        slug: 'dien-tu',
        description: 'Các sản phẩm điện tử và công nghệ',
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const fashionCategory = await prisma.category.upsert({
      where: { slug: 'thoi-trang' },
      update: {},
      create: {
        name: 'Thời Trang',
        slug: 'thoi-trang',
        description: 'Quần áo, giày dép, phụ kiện thời trang',
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const foodCategory = await prisma.category.upsert({
      where: { slug: 'thuc-pham' },
      update: {},
      create: {
        name: 'Thực Phẩm',
        slug: 'thuc-pham',
        description: 'Thực phẩm và đồ uống',
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const phoneSubcategory = await prisma.category.upsert({
      where: { slug: 'dien-thoai' },
      update: {},
      create: {
        name: 'Điện Thoại',
        slug: 'dien-thoai',
        description: 'Điện thoại di động và smartphone',
        parentId: electronicsCategory.id,
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const laptopSubcategory = await prisma.category.upsert({
      where: { slug: 'laptop' },
      update: {},
      create: {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Máy tính xách tay',
        parentId: electronicsCategory.id,
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const aoThunSubcategory = await prisma.category.upsert({
      where: { slug: 'ao-thun' },
      update: {},
      create: {
        name: 'Áo Thun',
        slug: 'ao-thun',
        description: 'Áo thun nam nữ',
        parentId: fashionCategory.id,
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    const giaySubcategory = await prisma.category.upsert({
      where: { slug: 'giay-dep' },
      update: {},
      create: {
        name: 'Giày Dép',
        slug: 'giay-dep',
        description: 'Giày dép thời trang',
        parentId: fashionCategory.id,
        isActive: true,
        productCount: 0,
        createdAt: BigInt(Date.now()),
      },
    });

    // Tạo Stores
    console.log('Creating stores...');
    const stores = [
      {
        slug: 'tech-store',
        name: 'Tech Store - Cửa Hàng Điện Tử',
        description: 'Chuyên cung cấp các sản phẩm điện tử, điện thoại, laptop chất lượng cao với giá tốt nhất thị trường. Cam kết hàng chính hãng, bảo hành đầy đủ.',
        shortDescription: 'Điện tử, điện thoại, laptop chính hãng',
        category: 'Electronics',
        addressCity: 'Ho Chi Minh',
        addressDistrict: 'Quận 1',
        addressWard: 'Phường Bến Nghé',
        addressStreet: '123 Nguyễn Huệ',
        contactPhone: '0901234567',
        contactEmail: 'techstore@chogiare.com',
        isVerified: true,
      },
      {
        slug: 'fashion-hub',
        name: 'Fashion Hub - Thời Trang Hiện Đại',
        description: 'Cửa hàng thời trang với đa dạng sản phẩm từ quần áo, giày dép đến phụ kiện. Luôn cập nhật xu hướng mới nhất, giá cả hợp lý.',
        shortDescription: 'Thời trang nam nữ, giày dép, phụ kiện',
        category: 'Fashion',
        addressCity: 'Ho Chi Minh',
        addressDistrict: 'Quận 3',
        addressWard: 'Phường Võ Thị Sáu',
        addressStreet: '456 Lê Văn Sỹ',
        contactPhone: '0902345678',
        contactEmail: 'fashionhub@chogiare.com',
        isVerified: true,
      },
      {
        slug: 'food-mart',
        name: 'Food Mart - Thực Phẩm Sạch',
        description: 'Chuyên cung cấp thực phẩm tươi sống, đồ khô, đồ uống chất lượng cao. Nguồn gốc rõ ràng, đảm bảo vệ sinh an toàn thực phẩm.',
        shortDescription: 'Thực phẩm tươi sống, đồ khô, đồ uống',
        category: 'Food & Beverage',
        addressCity: 'Ho Chi Minh',
        addressDistrict: 'Quận 7',
        addressWard: 'Phường Tân Phú',
        addressStreet: '789 Nguyễn Thị Thập',
        contactPhone: '0903456789',
        contactEmail: 'foodmart@chogiare.com',
        isVerified: false,
      },
    ];

    const createdStores = [];
    for (const storeData of stores) {
      const store = await prisma.store.upsert({
        where: { slug: storeData.slug },
        update: {},
        create: {
          userId: sellerUser.id,
          ...storeData,
          rating: 0,
          reviewCount: 0,
          productCount: 0,
          followerCount: 0,
          isActive: true,
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        },
      });
      createdStores.push(store);
      console.log(`  ✓ Created store: ${store.name}`);
    }

    // Tạo Products
    console.log('Creating products...');
    const now = BigInt(Date.now());

    const products = [
      // Điện thoại
      {
        title: 'iPhone 15 Pro Max 256GB - Chính Hãng Apple',
        description: 'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera 48MP chuyên nghiệp, màn hình Super Retina XDR 6.7 inch. Hàng chính hãng VN/A, bảo hành 12 tháng.',
        price: 29990000,
        originalPrice: 32990000,
        categoryId: phoneSubcategory.id,
        storeId: createdStores[0].id,
        condition: 'new' as const,
        tags: ['iphone', 'apple', 'smartphone', 'chính hãng'],
        location: 'Ho Chi Minh',
        stock: 50,
        minStock: 10,
        maxStock: 100,
        costPrice: 28000000,
        sellingPrice: 29990000,
        profit: 1990000,
        profitMargin: 6.63,
        sku: 'IP15PM-256-BL',
        barcode: '1234567890123',
        weight: 0.221,
        dimensions: '159.9 x 76.7 x 8.25 mm',
        supplier: 'Apple Vietnam',
        status: 'active' as const,
        badges: ['NEW', 'FEATURED', 'HOT'] as const,
        isFeatured: true,
        isPromoted: true,
        images: [
          'https://example.com/images/iphone15-1.jpg',
          'https://example.com/images/iphone15-2.jpg',
          'https://example.com/images/iphone15-3.jpg',
        ],
      },
      {
        title: 'Samsung Galaxy S24 Ultra 512GB',
        description: 'Galaxy S24 Ultra với bút S Pen, camera 200MP, màn hình Dynamic AMOLED 2X 6.8 inch. Hiệu năng mạnh mẽ với Snapdragon 8 Gen 3.',
        price: 26990000,
        originalPrice: 29990000,
        categoryId: phoneSubcategory.id,
        storeId: createdStores[0].id,
        condition: 'new' as const,
        tags: ['samsung', 'galaxy', 'smartphone', 's-pen'],
        location: 'Ho Chi Minh',
        stock: 30,
        minStock: 5,
        maxStock: 50,
        costPrice: 25000000,
        sellingPrice: 26990000,
        profit: 1990000,
        profitMargin: 7.37,
        sku: 'SGS24U-512-BK',
        barcode: '1234567890124',
        weight: 0.233,
        dimensions: '162.3 x 79.2 x 8.6 mm',
        supplier: 'Samsung Vietnam',
        status: 'active' as const,
        badges: ['NEW', 'FEATURED'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/galaxy-s24-1.jpg',
          'https://example.com/images/galaxy-s24-2.jpg',
        ],
      },
      {
        title: 'Xiaomi Redmi Note 13 Pro 128GB',
        description: 'Redmi Note 13 Pro với camera 200MP, màn hình AMOLED 6.67 inch, pin 5100mAh sạc nhanh 67W. Giá tốt, cấu hình mạnh.',
        price: 6990000,
        originalPrice: 7990000,
        categoryId: phoneSubcategory.id,
        storeId: createdStores[0].id,
        condition: 'new' as const,
        tags: ['xiaomi', 'redmi', 'budget', 'camera-200mp'],
        location: 'Ho Chi Minh',
        stock: 100,
        minStock: 20,
        maxStock: 200,
        costPrice: 6500000,
        sellingPrice: 6990000,
        profit: 490000,
        profitMargin: 7.01,
        sku: 'XMRN13P-128-BL',
        barcode: '1234567890125',
        weight: 0.199,
        dimensions: '161.1 x 74.95 x 8.23 mm',
        supplier: 'Xiaomi Vietnam',
        status: 'active' as const,
        badges: ['PROMO', 'SALE'] as const,
        isPromoted: true,
        images: [
          'https://example.com/images/redmi-note13-1.jpg',
          'https://example.com/images/redmi-note13-2.jpg',
        ],
      },
      // Laptop
      {
        title: 'MacBook Pro 14 inch M3 Pro 512GB',
        description: 'MacBook Pro 14 inch với chip M3 Pro, màn hình Liquid Retina XDR, pin lâu dài. Hoàn hảo cho công việc chuyên nghiệp và sáng tạo.',
        price: 54990000,
        originalPrice: 59990000,
        categoryId: laptopSubcategory.id,
        storeId: createdStores[0].id,
        condition: 'new' as const,
        tags: ['macbook', 'apple', 'laptop', 'm3-pro'],
        location: 'Ho Chi Minh',
        stock: 20,
        minStock: 5,
        maxStock: 30,
        costPrice: 52000000,
        sellingPrice: 54990000,
        profit: 2990000,
        profitMargin: 5.44,
        sku: 'MBP14-M3P-512-SL',
        barcode: '1234567890126',
        weight: 1.6,
        dimensions: '312.6 x 221.2 x 15.5 mm',
        supplier: 'Apple Vietnam',
        status: 'active' as const,
        badges: ['NEW', 'FEATURED'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/macbook-pro-1.jpg',
          'https://example.com/images/macbook-pro-2.jpg',
        ],
      },
      {
        title: 'Dell XPS 15 9530 - Intel Core i7, 16GB RAM, 512GB SSD',
        description: 'Dell XPS 15 với màn hình OLED 15.6 inch, Intel Core i7 gen 13, card đồ họa RTX 4050. Laptop cao cấp cho designer và developer.',
        price: 42990000,
        originalPrice: 46990000,
        categoryId: laptopSubcategory.id,
        storeId: createdStores[0].id,
        condition: 'new' as const,
        tags: ['dell', 'xps', 'laptop', 'intel-i7'],
        location: 'Ho Chi Minh',
        stock: 15,
        minStock: 3,
        maxStock: 25,
        costPrice: 40000000,
        sellingPrice: 42990000,
        profit: 2990000,
        profitMargin: 6.96,
        sku: 'DLLXPS15-I7-16-512',
        barcode: '1234567890127',
        weight: 1.92,
        dimensions: '344.72 x 230.14 x 18.54 mm',
        supplier: 'Dell Vietnam',
        status: 'active' as const,
        badges: ['FEATURED', 'HOT'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/dell-xps15-1.jpg',
          'https://example.com/images/dell-xps15-2.jpg',
        ],
      },
      // Thời trang - Áo thun
      {
        title: 'Áo Thun Nam Cổ Tròn Basic - Bộ 3 Cái',
        description: 'Áo thun nam chất liệu cotton 100%, co giãn tốt, thấm hút mồ hôi. Thiết kế đơn giản, dễ phối đồ. Bộ 3 cái với các màu cơ bản.',
        price: 299000,
        originalPrice: 399000,
        categoryId: aoThunSubcategory.id,
        storeId: createdStores[1].id,
        condition: 'new' as const,
        tags: ['áo thun', 'nam', 'basic', 'cotton'],
        location: 'Ho Chi Minh',
        stock: 500,
        minStock: 100,
        maxStock: 1000,
        costPrice: 200000,
        sellingPrice: 299000,
        profit: 99000,
        profitMargin: 33.11,
        sku: 'ATN-BASIC-3-SET',
        barcode: '1234567890128',
        weight: 0.3,
        dimensions: 'M, L, XL',
        supplier: 'Fashion Factory',
        status: 'active' as const,
        badges: ['PROMO', 'SALE'] as const,
        isPromoted: true,
        images: [
          'https://example.com/images/ao-thun-nam-1.jpg',
          'https://example.com/images/ao-thun-nam-2.jpg',
        ],
      },
      {
        title: 'Áo Thun Nữ Form Rộng Oversize - Nhiều Màu',
        description: 'Áo thun nữ form rộng oversize, chất liệu cotton mềm mại. Thiết kế unisex, dễ mặc, phù hợp nhiều phong cách. Có nhiều màu sắc.',
        price: 199000,
        originalPrice: 249000,
        categoryId: aoThunSubcategory.id,
        storeId: createdStores[1].id,
        condition: 'new' as const,
        tags: ['áo thun', 'nữ', 'oversize', 'unisex'],
        location: 'Ho Chi Minh',
        stock: 300,
        minStock: 50,
        maxStock: 500,
        costPrice: 120000,
        sellingPrice: 199000,
        profit: 79000,
        profitMargin: 39.70,
        sku: 'ATN-OVERSIZE-MULTI',
        barcode: '1234567890129',
        weight: 0.25,
        dimensions: 'S, M, L, XL',
        supplier: 'Fashion Factory',
        status: 'active' as const,
        badges: ['NEW', 'HOT'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/ao-thun-nu-1.jpg',
          'https://example.com/images/ao-thun-nu-2.jpg',
        ],
      },
      // Giày dép
      {
        title: 'Giày Thể Thao Nam Nike Air Max 270',
        description: 'Giày thể thao Nike Air Max 270 với đế Air Max đầy đủ, thiết kế hiện đại. Chất liệu da tổng hợp và lưới, êm ái, bền đẹp.',
        price: 3290000,
        originalPrice: 3990000,
        categoryId: giaySubcategory.id,
        storeId: createdStores[1].id,
        condition: 'new' as const,
        tags: ['giày', 'nike', 'thể thao', 'air-max'],
        location: 'Ho Chi Minh',
        stock: 80,
        minStock: 20,
        maxStock: 150,
        costPrice: 2800000,
        sellingPrice: 3290000,
        profit: 490000,
        profitMargin: 14.89,
        sku: 'GTN-NIKE-AM270-BK',
        barcode: '1234567890130',
        weight: 0.8,
        dimensions: 'Size 39-44',
        supplier: 'Nike Vietnam',
        status: 'active' as const,
        badges: ['FEATURED', 'SALE'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/giay-nike-1.jpg',
          'https://example.com/images/giay-nike-2.jpg',
        ],
      },
      {
        title: 'Giày Sneaker Nữ Adidas Originals Superstar',
        description: 'Giày sneaker nữ Adidas Superstar cổ điển, thiết kế iconic với 3 sọc. Chất liệu da tổng hợp, đế cao su bền chắc. Phù hợp mọi phong cách.',
        price: 2490000,
        originalPrice: 2990000,
        categoryId: giaySubcategory.id,
        storeId: createdStores[1].id,
        condition: 'new' as const,
        tags: ['giày', 'adidas', 'sneaker', 'nữ'],
        location: 'Ho Chi Minh',
        stock: 60,
        minStock: 15,
        maxStock: 100,
        costPrice: 2000000,
        sellingPrice: 2490000,
        profit: 490000,
        profitMargin: 19.68,
        sku: 'GSN-ADIDAS-SS-WH',
        barcode: '1234567890131',
        weight: 0.7,
        dimensions: 'Size 35-40',
        supplier: 'Adidas Vietnam',
        status: 'active' as const,
        badges: ['NEW', 'HOT'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/giay-adidas-1.jpg',
          'https://example.com/images/giay-adidas-2.jpg',
        ],
      },
      // Thực phẩm
      {
        title: 'Gạo ST25 Thơm Đặc Biệt - Túi 5kg',
        description: 'Gạo ST25 thơm đặc biệt, hạt dài, cơm dẻo thơm. Gạo ngon nhất Việt Nam, đạt giải World\'s Best Rice. Đóng gói túi 5kg.',
        price: 199000,
        originalPrice: 229000,
        categoryId: foodCategory.id,
        storeId: createdStores[2].id,
        condition: 'new' as const,
        tags: ['gạo', 'st25', 'thực phẩm', 'việt nam'],
        location: 'Ho Chi Minh',
        stock: 200,
        minStock: 50,
        maxStock: 500,
        costPrice: 150000,
        sellingPrice: 199000,
        profit: 49000,
        profitMargin: 24.62,
        sku: 'GAO-ST25-5KG',
        barcode: '1234567890132',
        weight: 5,
        dimensions: 'Túi 5kg',
        supplier: 'Công ty Gạo ST25',
        status: 'active' as const,
        badges: ['FEATURED', 'HOT'] as const,
        isFeatured: true,
        images: [
          'https://example.com/images/gao-st25-1.jpg',
          'https://example.com/images/gao-st25-2.jpg',
        ],
      },
      {
        title: 'Cà Phê Hòa Tan G7 3in1 - Hộp 18 Gói',
        description: 'Cà phê hòa tan G7 3in1 với hương vị đậm đà, thơm ngon. Tiện lợi, dễ pha chế. Hộp 18 gói, mỗi gói 16g.',
        price: 89000,
        originalPrice: 109000,
        categoryId: foodCategory.id,
        storeId: createdStores[2].id,
        condition: 'new' as const,
        tags: ['cà phê', 'g7', 'đồ uống', 'hòa tan'],
        location: 'Ho Chi Minh',
        stock: 500,
        minStock: 100,
        maxStock: 1000,
        costPrice: 65000,
        sellingPrice: 89000,
        profit: 24000,
        profitMargin: 26.97,
        sku: 'CF-G7-3IN1-18',
        barcode: '1234567890133',
        weight: 0.288,
        dimensions: 'Hộp 18 gói',
        supplier: 'Trung Nguyên',
        status: 'active' as const,
        badges: ['PROMO', 'SALE'] as const,
        isPromoted: true,
        images: [
          'https://example.com/images/ca-phe-g7-1.jpg',
          'https://example.com/images/ca-phe-g7-2.jpg',
        ],
      },
    ];

    for (const productData of products) {
      const { images, badges, ...productFields } = productData;
      
      const product = await prisma.product.create({
        data: {
          ...productFields,
          sellerId: sellerUser.id,
          badges: badges ? [...badges] : [],
          availableStock: productFields.stock,
          createdAt: now,
          updatedAt: now,
        } as Prisma.ProductUncheckedCreateInput,
      });

      // Tạo product images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              imageUrl: images[i],
              displayOrder: i,
              createdAt: now,
            },
          });
        }
      }

      // Cập nhật product count cho category
      await prisma.category.update({
        where: { id: productFields.categoryId },
        data: {
          productCount: {
            increment: 1,
          },
        },
      });

      // Cập nhật product count cho store
      if (productFields.storeId) {
        await prisma.store.update({
          where: { id: productFields.storeId },
          data: {
            productCount: {
              increment: 1,
            },
          },
        });
      }

      console.log(`  ✓ Created product: ${product.title}`);
    }

    console.log('\n✅ Products and stores seeder completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Stores created: ${createdStores.length}`);
    console.log(`  - Products created: ${products.length}`);
    console.log(`\n💡 Tip: Bạn có thể xem chi tiết tại Prisma Studio: npm run prisma:studio`);
  } catch (error) {
    console.error('❌ Products and stores seeder failed:', error);
    throw error;
  }
}

seedProductsAndStores()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


