import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifySeededPackages() {
  console.log('🔍 Verifying seeded boost packages...\n');

  try {
    // Count by type
    const countByType = await prisma.boostPackage.groupBy({
      by: ['type'],
      _count: true,
    });

    console.log('📊 Package count by type:');
    countByType.forEach((item) => {
      console.log(`  ${item.type}: ${item._count} packages`);
    });

    // Get all packages
    const allPackages = await prisma.boostPackage.findMany({
      orderBy: [{ type: 'asc' }, { price: 'asc' }],
    });

    console.log(`\n📦 Total packages: ${allPackages.length}\n`);
    console.log('Detailed package list:');
    console.log('─'.repeat(80));

    allPackages.forEach((pkg) => {
      console.log(`\n${pkg.name}`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Type: ${pkg.type}`);
      console.log(`  Price: ${pkg.price} VND`);
      console.log(`  Active: ${pkg.isActive ? '✅' : '❌'}`);
      console.log(`  Config: ${JSON.stringify(pkg.config, null, 2)}`);
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ Verification completed successfully');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeededPackages();
