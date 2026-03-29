import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const PASSWORD = 'Abc@1234';
const SALT_ROUNDS = 10;

// Role IDs must match database
const ROLE_IDS = {
  ADMIN: 1,
  USER: 2,
};

// All 3 users to seed
const USERS = [
  {
    email: 'admin@chogiare.com',
    fullName: 'Administrator',
    roles: [ROLE_IDS.ADMIN, ROLE_IDS.USER],
    // No seller fields for admin
  },
  {
    email: 'tringuyen@yopmail.com',
    fullName: 'Tri Nguyen',
    roles: [ROLE_IDS.USER],
    // Seller profile
    sellerName: 'Tri Nguyen Store',
    sellerSlug: 'tri-nguyen-store',
    sellerDescription: 'Cửa hàng bán sỉ chuyên nghiệp - Giá tốt nhất thị trường',
    sellerIsVerified: true,
  },
  {
    email: 'edyn@yopmail.com',
    fullName: 'Edyn Buyer',
    roles: [ROLE_IDS.USER],
    // Regular buyer, no seller fields
  },
];

/**
 * Seed all users: admin, seller (tringuyen), buyer (edyn)
 * Returns the created/existing users keyed by email
 */
export async function seedAdminUser(
  prisma: PrismaClient,
): Promise<Record<string, { id: number; email: string }>> {
  console.log('👤 Seeding users...');

  const now = BigInt(Date.now());
  const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  // Create roles
  await prisma.role.create({ data: { id: ROLE_IDS.ADMIN, name: 'admin', description: 'Administrator with full system access', createdAt: now } });
  await prisma.role.create({ data: { id: ROLE_IDS.USER, name: 'user', description: 'Regular user', createdAt: now } });
  console.log('  ✓ Roles created');

  const result: Record<string, { id: number; email: string }> = {};

  for (const userData of USERS) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        hashedPassword,
        isVerified: true,
        status: true,
        language: 0,
        fullName: userData.fullName,
        country: 'Vietnam',
        ...(userData.sellerName && {
          sellerName: userData.sellerName,
          sellerSlug: userData.sellerSlug,
          sellerDescription: userData.sellerDescription,
          sellerIsVerified: userData.sellerIsVerified ?? false,
        }),
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log(`  ✓ Created "${userData.fullName}" (id: ${user.id})`);

    // Assign roles
    for (const roleId of userData.roles) {
      await prisma.userRole.create({ data: { userId: user.id, roleId } });
    }

    result[userData.email] = { id: user.id, email: userData.email };
  }

  // Seed wallet balance for seller
  const seller = result['tringuyen@yopmail.com'];
  if (seller) {
    await prisma.userBalance.create({
      data: { userId: seller.id, balance: 5000000, updatedAt: now },
    });
    console.log(`  💰 Seller wallet: 5,000,000 VND`);
  }

  console.log(`  📧 All passwords: ${PASSWORD}`);
  console.log(`  📊 ${Object.keys(result).length} users seeded`);

  return result;
}
