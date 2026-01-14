import { PrismaClient } from '@prisma/client';

const depositPackages = [
  { name: '50K', amount: 50000, displayOrder: 1 },
  { name: '100K', amount: 100000, displayOrder: 2 },
  { name: '200K', amount: 200000, displayOrder: 3 },
  { name: '500K', amount: 500000, displayOrder: 4 },
  { name: '1M', amount: 1000000, displayOrder: 5 },
  { name: '2M', amount: 2000000, displayOrder: 6 },
];

export async function seedDepositPackages(prisma: PrismaClient) {
  console.log('📦 Seeding deposit packages...');

  const now = BigInt(Date.now());

  for (const pkg of depositPackages) {
    const existing = await prisma.depositPackage.findFirst({
      where: { amount: pkg.amount },
    });

    if (!existing) {
      await prisma.depositPackage.create({
        data: {
          name: pkg.name,
          amount: pkg.amount,
          displayOrder: pkg.displayOrder,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`  ✓ Created deposit package: ${pkg.name}`);
    } else {
      console.log(`  - Deposit package ${pkg.name} already exists`);
    }
  }

  console.log('✅ Deposit packages seeding completed');
}
