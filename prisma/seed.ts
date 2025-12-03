import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Roles
  console.log('Creating roles...');
  const buyerRole = await prisma.role.upsert({
    where: { name: 'buyer' },
    update: {},
    create: {
      name: 'buyer',
      description: 'Người mua hàng',
      createdAt: BigInt(Date.now()),
    },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name: 'seller' },
    update: {},
    create: {
      name: 'seller',
      description: 'Người bán hàng',
      createdAt: BigInt(Date.now()),
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Quản trị viên',
      createdAt: BigInt(Date.now()),
    },
  });

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@chogiare.com' },
    update: {},
    create: {
      email: 'admin@chogiare.com',
      username: 'admin',
      hashedPassword,
      isVerified: true,
      status: true,
      language: 'vi',
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  // Assign admin role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  // Create Test Users
  console.log('Creating test users...');
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

  const buyerPassword = await bcrypt.hash('buyer123', 10);
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@chogiare.com' },
    update: {},
    create: {
      email: 'buyer@chogiare.com',
      username: 'buyer',
      hashedPassword: buyerPassword,
      isVerified: true,
      status: true,
      language: 'vi',
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: buyerUser.id,
        roleId: buyerRole.id,
      },
    },
    update: {},
    create: {
      userId: buyerUser.id,
      roleId: buyerRole.id,
    },
  });

  // Create User Info
  console.log('Creating user info...');
  await prisma.userInfo.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      fullName: 'Admin User',
      phoneNumber: '0123456789',
      country: 'Vietnam',
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  await prisma.userInfo.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      fullName: 'Seller User',
      phoneNumber: '0987654321',
      country: 'Vietnam',
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  await prisma.userInfo.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      fullName: 'Buyer User',
      phoneNumber: '0912345678',
      country: 'Vietnam',
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  // Create Categories
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

  // Create Subcategories
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

  // Create Store
  console.log('Creating store...');
  const store = await prisma.store.upsert({
    where: { slug: 'cua-hang-mau' },
    update: {},
    create: {
      userId: sellerUser.id,
      name: 'Cửa Hàng Mẫu',
      slug: 'cua-hang-mau',
      description: 'Cửa hàng mẫu để test hệ thống',
      shortDescription: 'Cửa hàng mẫu',
      category: 'Electronics',
      addressCity: 'Ho Chi Minh',
      addressDistrict: 'Quận 1',
      contactPhone: '0987654321',
      contactEmail: 'seller@chogiare.com',
      rating: 0,
      reviewCount: 0,
      productCount: 0,
      followerCount: 0,
      isVerified: false,
      isActive: true,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    },
  });

  // Create Boost Packages
  console.log('Creating boost packages...');
  await prisma.boostPackage.upsert({
    where: { id: 'featured-7days' },
    update: {},
    create: {
      id: 'featured-7days',
      name: 'Nổi bật 7 ngày',
      type: 'payPerDay',
      price: 500000,
      description: 'Đẩy sản phẩm lên vị trí nổi bật trong 7 ngày',
      configDays: 7,
      configShowInBanner: true,
      configShowInTopList: true,
      isActive: true,
      createdAt: BigInt(Date.now()),
    },
  });

  await prisma.boostPackage.upsert({
    where: { id: 'featured-30days' },
    update: {},
    create: {
      id: 'featured-30days',
      name: 'Nổi bật 30 ngày',
      type: 'payPerDay',
      price: 2000000,
      description: 'Đẩy sản phẩm lên vị trí nổi bật trong 30 ngày',
      configDays: 30,
      configShowInBanner: true,
      configShowInTopList: true,
      isActive: true,
      createdAt: BigInt(Date.now()),
    },
  });

  // Create User Balance
  console.log('Creating user balances...');
  await prisma.userBalance.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      balance: 10000000,
      updatedAt: BigInt(Date.now()),
    },
  });

  await prisma.userBalance.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      balance: 5000000,
      updatedAt: BigInt(Date.now()),
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test Accounts:');
  console.log('Admin: admin@chogiare.com / admin123');
  console.log('Seller: seller@chogiare.com / seller123');
  console.log('Buyer: buyer@chogiare.com / buyer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

