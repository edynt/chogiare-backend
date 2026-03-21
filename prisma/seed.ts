import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedAdminUser } from './seeders/seed-admin-user';
import { seedCategories } from './seeders/seed-categories';
import { seedServicePackages } from './seeders/seed-service-packages';
import { seedDepositPackages } from './seeders/seed-deposit-packages';
import { seedProductsWithRelatedData } from './seeders/seed-products-with-related-data';

// Create Prisma client with proper configuration
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Check if using Prisma Accelerate
  if (databaseUrl.startsWith('prisma+')) {
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  // Use PrismaPg adapter for regular PostgreSQL
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
}

const prisma = createPrismaClient();

/**
 * Wipe all seeded tables in FK-safe order (leaves → roots).
 * Uses TRUNCATE CASCADE for reliability.
 */
async function cleanDatabase() {
  console.log('🧹 Cleaning database...');

  // Tables ordered: children first, parents last
  const tables = [
    'reviews',
    'product_images',
    'product_boosts',
    'stock_in_records',
    'cart_items',
    'order_items',
    'transactions',
    'orders',
    'carts',
    'products',
    'ticket_replies',
    'ticket_attachments',
    'support_tickets',
    'chat_messages',
    'conversation_participants',
    'conversations',
    'notifications',
    'subscription_purchases',
    'user_subscriptions',
    'user_balances',
    'sessions',
    'email_verifications',
    'password_resets',
    'user_roles',
    'role_permissions',
    'addresses',
    'users',
    'categories',
    'roles',
    'permissions',
    'service_packages',
    'deposit_packages',
    'system_settings',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }

  console.log(`  ✓ Truncated ${tables.length} tables\n`);
}

/**
 * Main seed function
 * Cleans all data then seeds fresh
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    await cleanDatabase();

    const users = await seedAdminUser(prisma);
    await seedCategories(prisma);
    await seedServicePackages(prisma);
    await seedDepositPackages(prisma);
    await seedProductsWithRelatedData(prisma, users);

    console.log('\n✅ Seeding completed successfully');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

// Execute main function
main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
