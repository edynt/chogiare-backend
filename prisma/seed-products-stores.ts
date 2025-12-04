import 'dotenv/config';
import { PrismaClient, ProductBadge } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Kết nối PostgreSQL thông qua adapter mới
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper
const now = BigInt(Date.now());

async function main() {
  console.log('🌱 START SEEDING...');

  // ========================================================
  // 1. ROLE
  // ========================================================
  console.log('→ Creating admin role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Quản trị viên',
      createdAt: now,
    },
  });

  // ========================================================
  // 2. ADMIN USER
  // ========================================================
  console.log('→ Creating admin user...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@chogiare.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminUserName = process.env.ADMIN_USERNAME || 'admin';

  const hashedPassword = await bcrypt.hash(adminPass, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      hashedPassword,
      username: adminUserName,
      updatedAt: now,
    },
    create: {
      email: adminEmail,
      username: adminUserName,
      hashedPassword,
      isVerified: true,
      status: true,
      language: 'vi',
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log('→ Assigning admin role...');
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
  // 3. CATEGORY
  // ========================================================
  console.log('→ Creating category...');

  const category = await prisma.category.upsert({
    where: { slug: 'thoi-trang-nu' },
    update: {},
    create: {
      name: 'Thời trang nữ',
      slug: 'thoi-trang-nu',
      description: 'Danh mục thời trang dành cho nữ',
      isActive: true,
      productCount: 0,
      createdAt: now,
    },
  });

  // ========================================================
  // 4. STORE
  // ========================================================
  console.log('→ Creating store...');

  const store = await prisma.store.upsert({
    where: { slug: 'chogiaret-store' },
    update: {},
    create: {
      userId: adminUser.id,
      name: 'Chợ Giá Rẻ Test Store',
      slug: 'chogiaret-store',
      description: 'Cửa hàng mẫu để test dữ liệu',
      shortDescription: 'Cửa hàng test',
      category: 'Fashion',
      addressCity: 'Ho Chi Minh',
      addressDistrict: 'Quận 1',
      contactPhone: '0123456789',
      contactEmail: adminEmail,
      rating: 0,
      reviewCount: 0,
      productCount: 0,
      followerCount: 0,
      isVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  // ========================================================
  // 5. SAMPLE PRODUCTS
  // ========================================================
  console.log('→ Creating sample products...');

  const products = [
    {
      title: 'Áo thun nữ cotton form rộng',
      description: 'Áo thun nữ chất cotton thoáng mát, mặc thoải mái',
      price: 120000,
      stock: 50,
      categoryId: category.id,
      images: ['https://picsum.photos/seed/aothun1/600', 'https://picsum.photos/seed/aothun2/600'],
      badges: ['NEW', 'HOT'],
    },
    {
      title: 'Đầm xòe dự tiệc cao cấp',
      description: 'Đầm xòe sang trọng phù hợp đi tiệc',
      price: 350000,
      stock: 20,
      categoryId: category.id,
      images: ['https://picsum.photos/seed/dam1/600', 'https://picsum.photos/seed/dam2/600'],
      badges: ['SALE'],
    },
  ];

  for (const productData of products) {
    const { images, badges, ...productFields } = productData;

    const product = await prisma.product.create({
      data: {
        ...productFields,
        sellerId: adminUser.id,
        storeId: store.id,
        condition: 'new',
        status: 'active',
        tags: [],
        badges: badges ? (badges as ProductBadge[]) : [],
        availableStock: productFields.stock,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log(`   ✓ Product created: ${product.title}`);

    if (images && images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((url, index) => ({
          productId: product.id,
          imageUrl: url,
          displayOrder: index,
          createdAt: now,
        })),
      });
    }
  }

  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
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
