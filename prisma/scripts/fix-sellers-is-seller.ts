/**
 * Migration script to fix isSeller flag for existing users with products
 *
 * Problem: Seeder created users as sellers but didn't set isSeller = true
 * Solution: Find all users who have products and update their isSeller flag
 *
 * Run with: npx ts-node prisma/scripts/fix-sellers-is-seller.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (databaseUrl.startsWith('prisma+')) {
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
}

const prisma = createPrismaClient();

async function main() {
  console.log('🔧 Fixing isSeller flag for users with products...\n');

  // Find all unique sellerIds from products
  const productsWithSellers = await prisma.product.findMany({
    select: { sellerId: true },
    distinct: ['sellerId'],
  });

  const sellerIds = productsWithSellers.map(p => p.sellerId);
  console.log(`Found ${sellerIds.length} unique seller IDs from products`);

  // Find users with products who don't have isSeller = true
  const usersToUpdate = await prisma.user.findMany({
    where: {
      id: { in: sellerIds },
      isSeller: false,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isSeller: true,
      sellerName: true,
      sellerSlug: true,
    },
  });

  console.log(`Found ${usersToUpdate.length} users that need isSeller = true\n`);

  if (usersToUpdate.length === 0) {
    console.log('✅ All sellers already have isSeller = true. No updates needed.');
    return;
  }

  // Update each user
  let updatedCount = 0;
  for (const user of usersToUpdate) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSeller: true,
          sellerName: user.sellerName || user.fullName || user.email?.split('@')[0] || 'Seller',
          sellerSlug: user.sellerSlug || `seller-${user.id}`,
          updatedAt: BigInt(Date.now()),
        },
      });
      console.log(`  ✓ Updated user ${user.id} (${user.email})`);
      updatedCount++;
    } catch (error) {
      console.error(`  ✗ Failed to update user ${user.id}:`, error);
    }
  }

  console.log(`\n✅ Updated ${updatedCount}/${usersToUpdate.length} users`);
}

main()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  });
