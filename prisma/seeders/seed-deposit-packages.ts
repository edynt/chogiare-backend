import { PrismaClient } from '@prisma/client';

/**
 * Minimal deposit packages: 50K, 200K, 1M
 */
const DEPOSIT_PACKAGES = [
  { name: '50K', amount: 50000, displayOrder: 1 },
  { name: '200K', amount: 200000, displayOrder: 2 },
  { name: '1M', amount: 1000000, displayOrder: 3 },
];

export async function seedDepositPackages(prisma: PrismaClient) {
  console.log('💳 Seeding deposit packages...');

  const now = BigInt(Date.now());

  for (const pkg of DEPOSIT_PACKAGES) {
    await prisma.depositPackage.create({
      data: { name: pkg.name, amount: pkg.amount, displayOrder: pkg.displayOrder, isActive: true, createdAt: now, updatedAt: now },
    });
    console.log(`  ✓ ${pkg.name}`);
  }

  console.log(`  📊 ${DEPOSIT_PACKAGES.length} deposit packages created`);
}
