import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedAdminUser } from './seeders/seed-admin-user';

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
    // Run seeders
    await seedAdminUser(prisma);

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
