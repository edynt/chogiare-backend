import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Setup Prisma 7 + Postgres adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  console.log('🌱 Starting admin seeder...');

  try {
    console.log('Creating admin role...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Quản trị viên',
        createdAt: BigInt(Date.now()),
      },
    });

    console.log('Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chogiare.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        hashedPassword,
        username: adminUsername,
        isVerified: true,
        status: true,
        language: 'vi',
        updatedAt: BigInt(Date.now()),
      },
      create: {
        email: adminEmail,
        username: adminUsername,
        hashedPassword,
        isVerified: true,
        status: true,
        language: 'vi',
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });

    console.log('Assigning admin role...');
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

    console.log('Creating admin user info...');
    await prisma.userInfo.upsert({
      where: { userId: adminUser.id },
      update: {
        fullName: 'Admin User',
        phoneNumber: '0123456789',
        country: 'Vietnam',
        updatedAt: BigInt(Date.now()),
      },
      create: {
        userId: adminUser.id,
        fullName: 'Admin User',
        phoneNumber: '0123456789',
        country: 'Vietnam',
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
      },
    });

    console.log('✅ Admin seeder completed successfully!');
  } catch (error) {
    console.error('❌ Admin seeder failed:', error);
    throw error;
  }
}

seedAdmin()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
