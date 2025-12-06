import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const now = BigInt(Date.now());
const oneDayAgo = BigInt(Date.now() - 24 * 60 * 60 * 1000);
const oneWeekAgo = BigInt(Date.now() - 7 * 24 * 60 * 60 * 1000);
const oneMonthAgo = BigInt(Date.now() - 30 * 24 * 60 * 60 * 1000);

async function main() {
  console.log('🌱 Starting full system seed...\n');

  try {
    await seedRolesAndPermissions();
    await seedUsers();
    await seedCategories();
    await seedStores();
    await seedProducts();
    await seedAddresses();
    await seedCarts();
    await seedOrders();
    await seedReviews();
    await seedConversations();
    await seedTransactions();
    await seedShipping();
    await seedBoostPackages();
    await seedProductBoosts();
    await seedStockRecords();
    await seedNotifications();
    await seedUserBalances();

    console.log('\n✅ Full system seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

async function seedRolesAndPermissions() {
  console.log('📋 Creating roles and permissions...');

  const roles = [
    { name: 'admin', description: 'Quản trị viên hệ thống' },
    { name: 'seller', description: 'Người bán hàng' },
    { name: 'buyer', description: 'Người mua hàng' },
  ];

  const permissions = [
    { name: 'users.read', description: 'Xem danh sách users' },
    { name: 'users.write', description: 'Tạo/sửa users' },
    { name: 'users.delete', description: 'Xóa users' },
    { name: 'products.read', description: 'Xem sản phẩm' },
    { name: 'products.write', description: 'Tạo/sửa sản phẩm' },
    { name: 'products.delete', description: 'Xóa sản phẩm' },
    { name: 'orders.read', description: 'Xem đơn hàng' },
    { name: 'orders.write', description: 'Tạo/sửa đơn hàng' },
    { name: 'stores.read', description: 'Xem cửa hàng' },
    { name: 'stores.write', description: 'Tạo/sửa cửa hàng' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: {
        ...roleData,
        createdAt: now,
      },
    });
  }

  const permissionMap = new Map();
  for (const permData of permissions) {
    const perm = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: {
        ...permData,
        createdAt: now,
      },
    });
    permissionMap.set(permData.name, perm);
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  const sellerRole = await prisma.role.findUnique({ where: { name: 'seller' } });
  const buyerRole = await prisma.role.findUnique({ where: { name: 'buyer' } });

  if (adminRole) {
    for (const perm of permissionMap.values()) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  if (sellerRole) {
    const sellerPerms = ['products.read', 'products.write', 'orders.read', 'stores.read', 'stores.write'];
    for (const permName of sellerPerms) {
      const perm = permissionMap.get(permName);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: sellerRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: sellerRole.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  if (buyerRole) {
    const buyerPerms = ['products.read', 'orders.read', 'orders.write'];
    for (const permName of buyerPerms) {
      const perm = permissionMap.get(permName);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: buyerRole.id,
              permissionId: perm.id,
            },
          },
          update: {},
          create: {
            roleId: buyerRole.id,
            permissionId: perm.id,
          },
        });
      }
    }
  }

  console.log('✅ Roles and permissions created');
}

async function seedUsers() {
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

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
      createdAt: oneMonthAgo,
      updatedAt: now,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (adminRole) {
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
  }

  await prisma.userInfo.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      fullName: 'Admin User',
      phoneNumber: '0123456789',
      country: 'Vietnam',
      metadata: {
        preferences: { theme: 'light', notifications: true },
      },
      createdAt: oneMonthAgo,
      updatedAt: now,
    },
  });

  const sellerRole = await prisma.role.findUnique({ where: { name: 'seller' } });
  const buyerRole = await prisma.role.findUnique({ where: { name: 'buyer' } });

  const sellers = [];
  for (let i = 1; i <= 5; i++) {
    const sellerEmail = `seller${i}@chogiare.com`;
    const seller = await prisma.user.upsert({
      where: { email: sellerEmail },
      update: {
        hashedPassword,
        isVerified: i <= 3,
        status: true,
        updatedAt: now,
      },
      create: {
        email: sellerEmail,
        username: `seller${i}`,
        hashedPassword,
        isVerified: i <= 3,
        status: true,
        language: 'vi',
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });

    if (sellerRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: seller.id,
            roleId: sellerRole.id,
          },
        },
        update: {},
        create: {
          userId: seller.id,
          roleId: sellerRole.id,
        },
      });
    }

    await prisma.userInfo.upsert({
      where: { userId: seller.id },
      update: {
        fullName: faker.person.fullName(),
        phoneNumber: `0${faker.string.numeric(9)}`,
        avatarUrl: faker.image.avatar(),
        updatedAt: now,
      },
      create: {
        userId: seller.id,
        fullName: faker.person.fullName(),
        phoneNumber: `0${faker.string.numeric(9)}`,
        country: 'Vietnam',
        avatarUrl: faker.image.avatar(),
        metadata: {
          preferences: { theme: 'light' },
        },
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });

    sellers.push(seller);
  }

  const buyers = [];
  for (let i = 1; i <= 10; i++) {
    const buyerEmail = `buyer${i}@chogiare.com`;
    const buyer = await prisma.user.upsert({
      where: { email: buyerEmail },
      update: {
        hashedPassword,
        isVerified: true,
        status: true,
        updatedAt: now,
      },
      create: {
        email: buyerEmail,
        username: `buyer${i}`,
        hashedPassword,
        isVerified: true,
        status: true,
        language: 'vi',
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });

    if (buyerRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: buyer.id,
            roleId: buyerRole.id,
          },
        },
        update: {},
        create: {
          userId: buyer.id,
          roleId: buyerRole.id,
        },
      });
    }

    await prisma.userInfo.upsert({
      where: { userId: buyer.id },
      update: {
        fullName: faker.person.fullName(),
        phoneNumber: `0${faker.string.numeric(9)}`,
        avatarUrl: faker.image.avatar(),
        updatedAt: now,
      },
      create: {
        userId: buyer.id,
        fullName: faker.person.fullName(),
        phoneNumber: `0${faker.string.numeric(9)}`,
        country: 'Vietnam',
        avatarUrl: faker.image.avatar(),
        metadata: {
          preferences: { theme: 'light' },
        },
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });

    buyers.push(buyer);
  }

  console.log('✅ Users created (1 admin, 5 sellers, 10 buyers)');
  return { adminUser, sellers, buyers };
}

async function seedCategories() {
  console.log('📂 Creating categories...');

  const categories = [
    {
      name: 'Điện Tử',
      slug: 'dien-tu',
      description: 'Thiết bị điện tử và công nghệ',
      image: 'https://via.placeholder.com/300',
      parentId: null,
      displayOrder: 1,
    },
    {
      name: 'Thời Trang',
      slug: 'thoi-trang',
      description: 'Quần áo và phụ kiện thời trang',
      image: 'https://via.placeholder.com/300',
      parentId: null,
      displayOrder: 2,
    },
    {
      name: 'Thực Phẩm',
      slug: 'thuc-pham',
      description: 'Thực phẩm và đồ uống',
      image: 'https://via.placeholder.com/300',
      parentId: null,
      displayOrder: 3,
    },
    {
      name: 'Điện Thoại',
      slug: 'dien-thoai',
      description: 'Điện thoại di động',
      parentId: null,
      displayOrder: 4,
    },
    {
      name: 'Laptop',
      slug: 'laptop',
      description: 'Máy tính xách tay',
      parentId: null,
      displayOrder: 5,
    },
  ];

  const createdCategories = [];
  for (const catData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: {},
      create: {
        ...catData,
        metadata: {},
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });
    createdCategories.push(category);
  }

  const dienTu = createdCategories.find((c) => c.slug === 'dien-tu');
  const dienThoai = createdCategories.find((c) => c.slug === 'dien-thoai');
  const laptop = createdCategories.find((c) => c.slug === 'laptop');

  if (dienTu && dienThoai) {
    await prisma.category.update({
      where: { id: dienThoai.id },
      data: { parentId: dienTu.id },
    });
  }

  if (dienTu && laptop) {
    await prisma.category.update({
      where: { id: laptop.id },
      data: { parentId: dienTu.id },
    });
  }

  console.log('✅ Categories created');
  return createdCategories;
}

async function seedStores() {
  console.log('🏪 Creating stores...');

  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
  });

  const stores = [];
  for (let i = 0; i < sellers.length; i++) {
    const seller = sellers[i];
    const storeName = faker.company.name();
    const slug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const storeSlug = `${slug}-${seller.id}`;
    const store = await prisma.store.upsert({
      where: { slug: storeSlug },
      update: {},
      create: {
        userId: seller.id,
        name: storeName,
        slug: storeSlug,
        description: faker.company.catchPhrase(),
        shortDescription: faker.lorem.sentence(),
        logo: faker.image.url({ width: 200, height: 200 }),
        banner: faker.image.url({ width: 1200, height: 300 }),
        rating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
        reviewCount: Math.floor(Math.random() * 100),
        productCount: 0,
        followerCount: Math.floor(Math.random() * 1000),
        isVerified: i < 3,
        isActive: true,
        contactInfo: {
          phone: `0${faker.string.numeric(9)}`,
          email: seller.email,
          website: faker.internet.url(),
          facebook: `https://facebook.com/${slug}`,
          instagram: `https://instagram.com/${slug}`,
        },
        addressInfo: {
          street: faker.location.streetAddress(),
          ward: faker.location.secondaryAddress(),
          district: faker.location.county(),
          city: faker.location.city(),
          postalCode: faker.location.zipCode(),
          lat: parseFloat(faker.location.latitude().toString()),
          lng: parseFloat(faker.location.longitude().toString()),
        },
        businessInfo: {
          type: i % 2 === 0 ? 'individual' : 'company',
          establishedYear: 2020 + i,
          taxCode: `TAX${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
        },
        businessHours: {
          monday: { open: '08:00', close: '18:00', isOpen: true },
          tuesday: { open: '08:00', close: '18:00', isOpen: true },
          wednesday: { open: '08:00', close: '18:00', isOpen: true },
          thursday: { open: '08:00', close: '18:00', isOpen: true },
          friday: { open: '08:00', close: '18:00', isOpen: true },
          saturday: { open: '09:00', close: '17:00', isOpen: true },
          sunday: { open: '10:00', close: '16:00', isOpen: false },
        },
        policies: {
          returnPolicy: 'Hoàn trả trong vòng 7 ngày',
          shippingPolicy: 'Miễn phí ship cho đơn hàng trên 500k',
        },
        metadata: {},
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });
    stores.push(store);
  }

  console.log(`✅ Stores created (${stores.length} stores)`);
  return stores;
}

async function seedProducts() {
  console.log('📦 Creating products...');

  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
    include: {
      stores: true,
    },
  });

  const categories = await prisma.category.findMany();

  const conditions = ['new', 'like_new', 'good', 'fair', 'poor'];
  const statuses = ['draft', 'active', 'active', 'active', 'sold'];
  const badges = [['NEW'], ['FEATURED'], ['PROMO'], ['HOT'], ['SALE'], []];

  const products = [];
  for (let i = 0; i < 50; i++) {
    const seller = sellers[i % sellers.length];
    const store = seller.stores[0];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)] as any;
    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    const productBadges = badges[Math.floor(Math.random() * badges.length)] as any;

    const price = Math.floor(Math.random() * 5000000) + 100000;
    const originalPrice = price * (1 + Math.random() * 0.3);
    const stock = Math.floor(Math.random() * 100) + 10;
    const costPrice = price * 0.6;
    const profit = price - costPrice;
    const profitMargin = (profit / price) * 100;

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        storeId: store?.id,
        categoryId: category.id,
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: price,
        originalPrice: Math.floor(originalPrice),
        condition,
        location: faker.location.city(),
        stock,
        minStock: 5,
        maxStock: 200,
        reservedStock: Math.floor(Math.random() * 5),
        availableStock: stock - Math.floor(Math.random() * 5),
        costPrice,
        sellingPrice: price,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        sku: `SKU-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 8)}`,
        barcode: faker.string.numeric(13),
        status,
        rating: parseFloat((Math.random() * 2 + 3).toFixed(2)),
        reviewCount: Math.floor(Math.random() * 50),
        viewCount: Math.floor(Math.random() * 1000),
        salesCount: Math.floor(Math.random() * 100),
        isFeatured: i < 5,
        isPromoted: i < 3,
        tags: faker.commerce.productAdjective().split(' '),
        badges: productBadges,
        inventoryInfo: {
          weight: parseFloat((Math.random() * 5).toFixed(2)),
          dimensions: `${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 30) + 5} cm`,
          supplier: faker.company.name(),
          location: faker.location.city(),
        },
        metadata: {
          brand: faker.company.name(),
          warranty: '12 tháng',
        },
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    const imageCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < imageCount; j++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: `https://picsum.photos/800/600?random=${i * 10 + j}`,
          displayOrder: j,
          createdAt: oneWeekAgo,
        },
      });
    }

    products.push(product);

    if (store) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          productCount: {
            increment: 1,
          },
        },
      });
    }

    await prisma.category.update({
      where: { id: category.id },
      data: {
        productCount: {
          increment: 1,
        },
      },
    });
  }

  console.log(`✅ Products created (${products.length} products)`);
  return products;
}

async function seedAddresses() {
  console.log('📍 Creating addresses...');

  const buyers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'buyer',
          },
        },
      },
    },
  });

  for (const buyer of buyers) {
    const addressCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < addressCount; i++) {
      await prisma.address.create({
        data: {
          userId: buyer.id,
          recipientName: faker.person.fullName(),
          recipientPhone: `0${faker.string.numeric(9)}`,
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          district: faker.location.county(),
          ward: faker.location.secondaryAddress(),
          zipCode: faker.location.zipCode(),
          country: 'Vietnam',
          isDefault: i === 0,
          addressMetadata: {
            landmark: faker.location.buildingNumber(),
            notes: i === 0 ? 'Địa chỉ nhà' : 'Địa chỉ văn phòng',
          },
          createdAt: oneMonthAgo,
          updatedAt: now,
        },
      });
    }
  }

  console.log('✅ Addresses created');
}

async function seedCarts() {
  console.log('🛒 Creating carts...');

  const buyers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'buyer',
          },
        },
      },
    },
  });

  const products = await prisma.product.findMany({
    where: { status: 'active' },
  });

  for (const buyer of buyers) {
    const cart = await prisma.cart.upsert({
      where: { userId: buyer.id },
      update: {},
      create: {
        userId: buyer.id,
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    const itemCount = Math.floor(Math.random() * 5) + 1;
    const selectedProducts = faker.helpers.arrayElements(products, itemCount);

    for (const product of selectedProducts) {
      await prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: product.id,
          },
        },
        update: {},
        create: {
          cartId: cart.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: Number(product.price),
          createdAt: oneWeekAgo,
          updatedAt: now,
        },
      });
    }
  }

  console.log('✅ Carts created');
}

async function seedOrders() {
  console.log('📋 Creating orders...');

  const buyers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'buyer',
          },
        },
      },
    },
  });

  const stores = await prisma.store.findMany();
  const products = await prisma.product.findMany({
    where: { status: 'active' },
  });

  const statuses = ['pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'];
  const paymentStatuses = ['pending', 'completed', 'completed', 'completed', 'failed'];
  const paymentMethods = ['momo', 'zalopay', 'bank_transfer', 'stripe'];

  for (let i = 0; i < 30; i++) {
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];
    const store = stores[Math.floor(Math.random() * stores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)] as any;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)] as any;

    const storeProducts = products.filter((p) => p.storeId === store.id);
    if (storeProducts.length === 0) continue;

    const selectedProducts = faker.helpers.arrayElements(storeProducts, Math.min(3, storeProducts.length));
    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.title,
      productImage: `https://picsum.photos/200/200?random=${product.id}`,
      price: Number(product.price),
      quantity: Math.floor(Math.random() * 3) + 1,
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 500000 ? 0 : 30000;
    const discount = subtotal > 1000000 ? subtotal * 0.1 : 0;
    const total = subtotal + shipping - discount;

    const addresses = await prisma.address.findMany({
      where: { userId: buyer.id },
    });
    const shippingAddress = addresses[0];
    const billingAddress = addresses[0];

    const order = await prisma.order.create({
      data: {
        userId: buyer.id,
        storeId: store.id,
        status,
        paymentStatus,
        paymentMethod,
        subtotal,
        tax: 0,
        shipping,
        discount,
        total,
        currency: 'VND',
        shippingAddressId: shippingAddress?.id,
        billingAddressId: billingAddress?.id,
        notes: faker.lorem.sentence(),
        orderMetadata: {
          source: 'web',
          ip: faker.internet.ip(),
        },
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          itemMetadata: {},
          createdAt: oneWeekAgo,
          updatedAt: now,
        },
      });
    }
  }

  console.log('✅ Orders created (30 orders)');
}

async function seedReviews() {
  console.log('⭐ Creating reviews...');

  const buyers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'buyer',
          },
        },
      },
    },
  });

  const orders = await prisma.order.findMany({
    where: { status: 'completed' },
    include: { items: true },
  });

  for (const order of orders) {
    if (order.items.length === 0) continue;

    const item = order.items[Math.floor(Math.random() * order.items.length)];
    const buyer = buyers.find((b) => b.id === order.userId);
    if (!buyer) continue;

    const rating = Math.floor(Math.random() * 3) + 3;
    const review = await prisma.review.upsert({
      where: {
        productId_userId_orderId: {
          productId: item.productId,
          userId: buyer.id,
          orderId: order.id,
        },
      },
      update: {
        rating,
        title: faker.lorem.sentence(),
        comment: faker.lorem.paragraph(),
        updatedAt: now,
      },
      create: {
        productId: item.productId,
        userId: buyer.id,
        orderId: order.id,
        rating,
        title: faker.lorem.sentence(),
        comment: faker.lorem.paragraph(),
        isVerified: true,
        helpfulCount: Math.floor(Math.random() * 20),
        reviewMetadata: {},
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    if (Math.random() > 0.5) {
      await prisma.reviewImage.create({
        data: {
          reviewId: review.id,
          imageUrl: `https://picsum.photos/400/400?random=${review.id}`,
          createdAt: oneWeekAgo,
        },
      });
    }

    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (product) {
      const allReviews = await prisma.review.findMany({ where: { productId: product.id } });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          rating: parseFloat(avgRating.toFixed(2)),
          reviewCount: allReviews.length,
        },
      });
    }
  }

  console.log('✅ Reviews created');
}

async function seedConversations() {
  console.log('💬 Creating conversations...');

  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
  });

  const buyers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'buyer',
          },
        },
      },
    },
  });

  for (let i = 0; i < 15; i++) {
    const seller = sellers[Math.floor(Math.random() * sellers.length)];
    const buyer = buyers[Math.floor(Math.random() * buyers.length)];

    const conversation = await prisma.conversation.create({
      data: {
        type: 'direct',
        metadata: {},
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    await prisma.conversationParticipant.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: seller.id,
          role: 'seller',
          joinedAt: oneWeekAgo,
          lastReadAt: oneDayAgo,
          metadata: {},
        },
        {
          conversationId: conversation.id,
          userId: buyer.id,
          role: 'buyer',
          joinedAt: oneWeekAgo,
          lastReadAt: now,
          metadata: {},
        },
      ],
    });

    const messageCount = Math.floor(Math.random() * 10) + 3;
    for (let j = 0; j < messageCount; j++) {
      const sender = j % 2 === 0 ? seller : buyer;
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          messageType: 'text',
          content: faker.lorem.sentence(),
          isRead: j < messageCount - 1,
          messageMetadata: {},
          createdAt: BigInt(Date.now() - (messageCount - j) * 60 * 60 * 1000),
          updatedAt: BigInt(Date.now() - (messageCount - j) * 60 * 60 * 1000),
        },
      });
    }

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: now },
    });
  }

  console.log('✅ Conversations created (15 conversations)');
}

async function seedTransactions() {
  console.log('💰 Creating transactions...');

  const users = await prisma.user.findMany();
  const orders = await prisma.order.findMany({
    where: { paymentStatus: 'completed' },
  });

  for (const order of orders) {
    await prisma.transaction.create({
      data: {
        userId: order.userId,
        type: 'sale',
        amount: order.total,
        currency: 'VND',
        status: 'completed',
        paymentMethod: order.paymentMethod,
        reference: `ORDER-${order.id}`,
        description: `Payment for order #${order.id}`,
        orderId: order.id,
        transactionMetadata: {
          gateway: order.paymentMethod,
          transactionId: faker.string.alphanumeric(20),
        },
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'deposit',
        amount: Math.floor(Math.random() * 5000000) + 100000,
        currency: 'VND',
        status: 'completed',
        paymentMethod: 'bank_transfer',
        reference: faker.string.alphanumeric(20),
        description: 'Top up balance',
        transactionMetadata: {},
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });
  }

  console.log('✅ Transactions created');
}

async function seedShipping() {
  console.log('🚚 Creating shipping...');

  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: ['confirmed', 'ready_for_pickup', 'completed'],
      },
    },
  });

  const carriers = ['Viettel Post', 'GHN', 'GHTK', 'J&T Express'];
  const statuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered'];

  for (const order of orders) {
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)] as any;
    const trackingNumber = `VN${faker.string.alphanumeric(10).toUpperCase()}`;

    const shipping = await prisma.shipping.upsert({
      where: { orderId: order.id },
      update: {
        trackingNumber,
        carrier,
        status,
        currentLocation: faker.location.city(),
        updatedAt: now,
      },
      create: {
        orderId: order.id,
        trackingNumber,
        carrier,
        status,
        currentLocation: faker.location.city(),
        estimatedDelivery: BigInt(Date.now() + 2 * 24 * 60 * 60 * 1000),
        shippingMetadata: {
          weight: Math.floor(Math.random() * 5) + 1,
          dimensions: '20x15x10 cm',
        },
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });

    const historyCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < historyCount; i++) {
      await prisma.shippingHistory.create({
        data: {
          shippingId: shipping.id,
          status: statuses[Math.min(i, statuses.length - 1)],
          location: faker.location.city(),
          description: faker.lorem.sentence(),
          timestamp: BigInt(Date.now() - (historyCount - i) * 60 * 60 * 1000),
          metadata: {},
        },
      });
    }
  }

  console.log('✅ Shipping created');
}

async function seedBoostPackages() {
  console.log('🚀 Creating boost packages...');

  const packages = [
    {
      id: 'ppv_1k',
      name: '1,000 lượt xem',
      type: 'payPerView' as const,
      price: 50000,
      description: 'Trả phí theo số lượt xem thực tế',
      config: { views: 1000, pricePer1000Views: 50000 },
      isActive: true,
    },
    {
      id: 'ppd_7',
      name: '7 ngày',
      type: 'payPerDay' as const,
      price: 250000,
      description: 'Đẩy bài trong 7 ngày',
      config: { days: 7 },
      isActive: true,
    },
    {
      id: 'featured_7',
      name: 'Vị trí nổi bật - 7 ngày',
      type: 'featuredSlot' as const,
      price: 600000,
      description: 'Hiển thị ở banner và top danh sách',
      config: { days: 7, showInBanner: true, showInTopList: true },
      isActive: true,
    },
    {
      id: 'category_7',
      name: 'Đẩy lên danh mục - 7 ngày',
      type: 'boostToCategory' as const,
      price: 180000,
      description: 'Đẩy sản phẩm lên đầu danh mục',
      config: { days: 7 },
      isActive: true,
    },
  ];

  for (const pkgData of packages) {
    await prisma.boostPackage.upsert({
      where: { id: pkgData.id },
      update: {},
      create: {
        ...pkgData,
        metadata: {},
        createdAt: oneMonthAgo,
        updatedAt: now,
      },
    });
  }

  console.log('✅ Boost packages created');
}

async function seedProductBoosts() {
  console.log('⭐ Creating product boosts...');

  const products = await prisma.product.findMany({
    where: { isPromoted: true },
    take: 5,
  });

  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
  });

  const packages = await prisma.boostPackage.findMany();

  for (const product of products) {
    const seller = sellers.find((s) => s.id === product.sellerId);
    if (!seller) continue;

    const pkg = packages[Math.floor(Math.random() * packages.length)];
    const days = pkg.type === 'payPerDay' || pkg.type === 'featuredSlot' || pkg.type === 'boostToCategory' ? 7 : null;
    const viewsTarget = pkg.type === 'payPerView' ? 1000 : null;
    const startDate = oneWeekAgo;
    const endDate = days ? BigInt(Number(startDate) + days * 24 * 60 * 60 * 1000) : null;

    await prisma.productBoost.create({
      data: {
        productId: product.id,
        boostPackageId: pkg.id,
        userId: seller.id,
        status: 'active',
        viewsTarget,
        viewsActual: Math.floor(Math.random() * 500),
        days,
        startDate,
        endDate,
        totalCost: Number(pkg.price),
        boostMetadata: {},
        createdAt: oneWeekAgo,
        updatedAt: now,
      },
    });
  }

  console.log('✅ Product boosts created');
}

async function seedStockRecords() {
  console.log('📦 Creating stock records...');

  const products = await prisma.product.findMany();
  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
  });

  for (const product of products) {
    const seller = sellers.find((s) => s.id === product.sellerId);
    if (!seller) continue;

    const recordCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < recordCount; i++) {
      await prisma.stockInRecord.create({
        data: {
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 10,
          costPrice: Number(product.costPrice) || Number(product.price) * 0.6,
          supplier: faker.company.name(),
          notes: faker.lorem.sentence(),
          createdBy: seller.id,
          recordMetadata: {},
          createdAt: BigInt(Date.now() - (recordCount - i) * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('✅ Stock records created');
}

async function seedNotifications() {
  console.log('🔔 Creating notifications...');

  const users = await prisma.user.findMany();
  const orders = await prisma.order.findMany();
  const types = ['order', 'product', 'payment', 'system', 'promotion'];

  for (const user of users) {
    const notificationCount = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < notificationCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)] as any;
      const order = orders[Math.floor(Math.random() * orders.length)];

      await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          title: faker.lorem.sentence(),
          message: faker.lorem.paragraph(),
          actionUrl: type === 'order' ? `/orders/${order.id}` : '/',
          isRead: Math.random() > 0.3,
          notificationMetadata: {},
          createdAt: BigInt(Date.now() - i * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('✅ Notifications created');
}

async function seedUserBalances() {
  console.log('💵 Creating user balances...');

  const sellers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            name: 'seller',
          },
        },
      },
    },
  });

  for (const seller of sellers) {
    await prisma.userBalance.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        balance: Math.floor(Math.random() * 10000000) + 1000000,
        updatedAt: now,
      },
    });
  }

  console.log('✅ User balances created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

