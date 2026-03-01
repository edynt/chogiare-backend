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
 * Main seed function
 * Executes all seeders in order
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed users first (admin, seller, buyer) - returns user map
    const users = await seedAdminUser(prisma);
    await seedCategories(prisma);
    await seedServicePackages(prisma);
    await seedDepositPackages(prisma);
    // Pass users so products are assigned to the seller
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
