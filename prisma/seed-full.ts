import 'dotenv/config';
import { PrismaClient, ProductBadge, ProductStatus, ProductCondition } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const now = BigInt(Date.now());

// Sample data
const categories = [
  { name: 'Thời trang nữ', slug: 'thoi-trang-nu', description: 'Quần áo, phụ kiện thời trang nữ' },
  { name: 'Thời trang nam', slug: 'thoi-trang-nam', description: 'Quần áo, phụ kiện thời trang nam' },
  { name: 'Điện thoại', slug: 'dien-thoai', description: 'Điện thoại di động và phụ kiện' },
  { name: 'Laptop', slug: 'laptop', description: 'Máy tính xách tay' },
  { name: 'Đồ gia dụng', slug: 'do-gia-dung', description: 'Đồ dùng trong gia đình' },
  { name: 'Mỹ phẩm', slug: 'my-pham', description: 'Mỹ phẩm và chăm sóc da' },
  { name: 'Thực phẩm', slug: 'thuc-pham', description: 'Thực phẩm và đồ uống' },
  { name: 'Sách', slug: 'sach', description: 'Sách và tài liệu' },
];

const productNames = {
  'thoi-trang-nu': [
    'Áo thun nữ cotton form rộng',
    'Đầm xòe dự tiệc cao cấp',
    'Quần jean nữ ống loe',
    'Áo khoác nữ dạ dày',
    'Váy liền thân công sở',
  ],
  'thoi-trang-nam': [
    'Áo sơ mi nam công sở',
    'Quần tây nam cao cấp',
    'Áo khoác nam bomber',
    'Giày thể thao nam',
    'Quần short nam thể thao',
  ],
  'dien-thoai': [
    'iPhone 14 Pro Max 256GB',
    'Samsung Galaxy S23 Ultra',
    'Xiaomi Redmi Note 12',
    'OPPO Find X5 Pro',
    'Vivo V27 Pro',
  ],
  'laptop': [
    'MacBook Pro M2 13"',
    'Dell XPS 13',
    'HP Pavilion 15',
    'ASUS ZenBook 14',
    'Lenovo ThinkPad X1',
  ],
  'do-gia-dung': [
    'Máy lọc không khí',
    'Nồi cơm điện cao tần',
    'Máy hút bụi không dây',
    'Bếp từ đôi',
    'Máy giặt cửa trước',
  ],
  'my-pham': [
    'Kem chống nắng SPF50+',
    'Serum vitamin C',
    'Mặt nạ đất sét',
    'Son môi lì',
    'Kem dưỡng ẩm',
  ],
  'thuc-pham': [
    'Gạo ST25 5kg',
    'Dầu ăn tinh luyện',
    'Mì tôm các loại',
    'Sữa tươi tiệt trùng',
    'Trái cây tươi',
  ],
  'sach': [
    'Sách kỹ năng sống',
    'Tiểu thuyết bestseller',
    'Sách thiếu nhi',
    'Sách giáo khoa',
    'Truyện tranh',
  ],
};

const locations = [
  'Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
];

async function main() {
  console.log('🌱 START FULL SEEDING...');

  // ========================================================
  // 1. ROLES
  // ========================================================
  console.log('→ Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Quản trị viên',
      createdAt: now,
    },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name: 'seller' },
    update: {},
    create: {
      name: 'seller',
      description: 'Người bán',
      createdAt: now,
    },
  });

  const buyerRole = await prisma.role.upsert({
    where: { name: 'buyer' },
    update: {},
    create: {
      name: 'buyer',
      description: 'Người mua',
      createdAt: now,
    },
  });

  // ========================================================
  // 2. ADMIN USER
  // ========================================================
  console.log('→ Creating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@chogiare.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedAdminPassword = await bcrypt.hash(adminPass, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      hashedPassword: hashedAdminPassword,
      username: 'admin',
      isVerified: true,
      status: true,
      updatedAt: now,
    },
    create: {
      email: adminEmail,
      username: 'admin',
      hashedPassword: hashedAdminPassword,
      isVerified: true,
      status: true,
      language: 'vi',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: adminUser.id, roleId: adminRole.id },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userInfo.upsert({
    where: { userId: adminUser.id },
    update: {
      fullName: 'Admin User',
      phoneNumber: '0123456789',
      country: 'Vietnam',
      updatedAt: now,
    },
    create: {
      userId: adminUser.id,
      fullName: 'Admin User',
      phoneNumber: '0123456789',
      country: 'Vietnam',
      createdAt: now,
      updatedAt: now,
    },
  });

  // ========================================================
  // 3. SELLER USERS & STORES
  // ========================================================
  console.log('→ Creating seller users and stores...');
  const sellers = [
    { email: 'seller1@chogiare.com', name: 'Nguyễn Văn A', storeName: 'Cửa hàng Thời trang A' },
    { email: 'seller2@chogiare.com', name: 'Trần Thị B', storeName: 'Shop Điện tử B' },
    { email: 'seller3@chogiare.com', name: 'Lê Văn C', storeName: 'Gian hàng Gia dụng C' },
  ];

  const createdStores = [];

  for (const sellerData of sellers) {
    const hashedPassword = await bcrypt.hash('seller123', 10);
    const seller = await prisma.user.upsert({
      where: { email: sellerData.email },
      update: {
        hashedPassword,
        username: sellerData.email.split('@')[0],
        isVerified: true,
        status: true,
        updatedAt: now,
      },
      create: {
        email: sellerData.email,
        username: sellerData.email.split('@')[0],
        hashedPassword,
        isVerified: true,
        status: true,
        language: 'vi',
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: seller.id, roleId: sellerRole.id },
      },
      update: {},
      create: {
        userId: seller.id,
        roleId: sellerRole.id,
      },
    });

    await prisma.userInfo.upsert({
      where: { userId: seller.id },
      update: {
        fullName: sellerData.name,
        phoneNumber: `09${Math.floor(Math.random() * 100000000)}`,
        country: 'Vietnam',
        updatedAt: now,
      },
      create: {
        userId: seller.id,
        fullName: sellerData.name,
        phoneNumber: `09${Math.floor(Math.random() * 100000000)}`,
        country: 'Vietnam',
        createdAt: now,
        updatedAt: now,
      },
    });

    const storeSlug = sellerData.storeName.toLowerCase().replace(/\s+/g, '-');
    const store = await prisma.store.upsert({
      where: { slug: storeSlug },
      update: {},
      create: {
        userId: seller.id,
        name: sellerData.storeName,
        slug: storeSlug,
        description: `Cửa hàng ${sellerData.storeName}`,
        shortDescription: sellerData.storeName,
        category: 'General',
        addressCity: locations[Math.floor(Math.random() * locations.length)],
        addressDistrict: 'Quận 1',
        contactPhone: `09${Math.floor(Math.random() * 100000000)}`,
        contactEmail: sellerData.email,
        rating: Math.floor(Math.random() * 15 + 35) / 10, // 3.5 - 5.0
        reviewCount: Math.floor(Math.random() * 100),
        productCount: 0,
        followerCount: Math.floor(Math.random() * 1000),
        isVerified: Math.random() > 0.3,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    createdStores.push({ store, seller });
  }

  // ========================================================
  // 4. CATEGORIES
  // ========================================================
  console.log('→ Creating categories...');
  const createdCategories = [];
  for (const catData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {},
      create: {
        name: catData.name,
        slug: catData.slug,
        description: catData.description,
        isActive: true,
        productCount: 0,
        createdAt: now,
      },
    });
    createdCategories.push(category);
  }

  // ========================================================
  // 5. PRODUCTS
  // ========================================================
  console.log('→ Creating products...');
  let productCount = 0;

  for (const { store, seller } of createdStores) {
    // Each store gets products from different categories
    const storeCategories = createdCategories.slice(0, 3); // Each store has 3 categories

    for (const category of storeCategories) {
      const categorySlug = category.slug as keyof typeof productNames;
      const names = productNames[categorySlug] || productNames['thoi-trang-nu'];

      // Create 5-8 products per category
      const productCountForCategory = Math.floor(Math.random() * 4) + 5;

      for (let i = 0; i < productCountForCategory; i++) {
        const name = names[i % names.length];
        const basePrice = Math.floor(Math.random() * 5000000) + 100000; // 100k - 5M
        const originalPrice = Math.random() > 0.7 ? Math.floor(basePrice * 1.2) : null;
        const stock = Math.floor(Math.random() * 100) + 10;
        const condition = ['new', 'like_new', 'good'][Math.floor(Math.random() * 3)] as ProductCondition;
        const status = ['active', 'active', 'active', 'draft'][Math.floor(Math.random() * 4)] as ProductStatus;
        const badges: ProductBadge[] = [];
        if (Math.random() > 0.7) badges.push('NEW');
        if (Math.random() > 0.8) badges.push('HOT');
        if (originalPrice) badges.push('SALE');

        const product = await prisma.product.create({
          data: {
            sellerId: seller.id,
            storeId: store.id,
            title: name,
            description: `Mô tả chi tiết cho sản phẩm ${name}. Chất lượng cao, giá tốt.`,
            price: basePrice,
            originalPrice,
            categoryId: category.id,
            condition,
            status,
            tags: ['chất lượng', 'giá tốt', 'uy tín'],
            badges,
            stock,
            availableStock: stock,
            location: locations[Math.floor(Math.random() * locations.length)],
            viewCount: Math.floor(Math.random() * 1000),
            rating: Math.floor(Math.random() * 30 + 40) / 10, // 4.0 - 5.0
            reviewCount: Math.floor(Math.random() * 50),
            createdAt: now,
            updatedAt: now,
          },
        });

        // Add product images
        const imageCount = Math.floor(Math.random() * 3) + 2; // 2-4 images
        await prisma.productImage.createMany({
          data: Array.from({ length: imageCount }, (_, index) => ({
            productId: product.id,
            imageUrl: `https://picsum.photos/seed/${product.id}-${index}/600`,
            displayOrder: index,
            createdAt: now,
          })),
        });

        productCount++;
        if (productCount % 10 === 0) {
          console.log(`   ✓ Created ${productCount} products...`);
        }
      }
    }
  }

  // Update category product counts
  for (const category of createdCategories) {
    const count = await prisma.product.count({
      where: { categoryId: category.id },
    });
    await prisma.category.update({
      where: { id: category.id },
      data: { productCount: count },
    });
  }

  // Update store product counts
  for (const { store } of createdStores) {
    const count = await prisma.product.count({
      where: { storeId: store.id },
    });
    await prisma.store.update({
      where: { id: store.id },
      data: { productCount: count },
    });
  }

  console.log(`✅ Created ${productCount} products total`);

  // ========================================================
  // 6. BUYER USERS
  // ========================================================
  console.log('→ Creating buyer users...');
  const buyers = [
    { email: 'buyer1@chogiare.com', name: 'Phạm Thị D' },
    { email: 'buyer2@chogiare.com', name: 'Hoàng Văn E' },
    { email: 'buyer3@chogiare.com', name: 'Vũ Thị F' },
  ];

  for (const buyerData of buyers) {
    const hashedPassword = await bcrypt.hash('buyer123', 10);
    const buyer = await prisma.user.upsert({
      where: { email: buyerData.email },
      update: {
        hashedPassword,
        username: buyerData.email.split('@')[0],
        isVerified: true,
        status: true,
        updatedAt: now,
      },
      create: {
        email: buyerData.email,
        username: buyerData.email.split('@')[0],
        hashedPassword,
        isVerified: true,
        status: true,
        language: 'vi',
        createdAt: now,
        updatedAt: now,
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: buyer.id, roleId: buyerRole.id },
      },
      update: {},
      create: {
        userId: buyer.id,
        roleId: buyerRole.id,
      },
    });

    await prisma.userInfo.upsert({
      where: { userId: buyer.id },
      update: {
        fullName: buyerData.name,
        phoneNumber: `09${Math.floor(Math.random() * 100000000)}`,
        country: 'Vietnam',
        updatedAt: now,
      },
      create: {
        userId: buyer.id,
        fullName: buyerData.name,
        phoneNumber: `09${Math.floor(Math.random() * 100000000)}`,
        country: 'Vietnam',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  console.log('🎉 FULL SEEDING COMPLETED SUCCESSFULLY!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin: ${adminEmail} / ${adminPass}`);
  console.log(`   - Sellers: seller1@chogiare.com, seller2@chogiare.com, seller3@chogiare.com / seller123`);
  console.log(`   - Buyers: buyer1@chogiare.com, buyer2@chogiare.com, buyer3@chogiare.com / buyer123`);
  console.log(`   - Categories: ${createdCategories.length}`);
  console.log(`   - Stores: ${createdStores.length}`);
  console.log(`   - Products: ${productCount}`);
}

main()
  .catch((err) => {
    console.error('❌ SEED FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

