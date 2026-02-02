import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'admin@chogiare.com';
const ADMIN_PASSWORD = 'Abc@1234';
const SALT_ROUNDS = 10;

// Role IDs must match database
const ROLE_IDS = {
  ADMIN: 1,
  USER: 2,
};

/**
 * Seed admin user
 * Creates admin@chogiare.com with admin role if not exists
 */
export async function seedAdminUser(prisma: PrismaClient): Promise<void> {
  console.log('👤 Seeding admin user...');

  const now = BigInt(Date.now());

  // Check if admin role exists, create if not
  const adminRole = await prisma.role.upsert({
    where: { id: ROLE_IDS.ADMIN },
    update: {},
    create: {
      id: ROLE_IDS.ADMIN,
      name: 'admin',
      description: 'Administrator with full system access',
      createdAt: now,
    },
  });
  console.log(`  ✓ Admin role ready (id: ${adminRole.id})`);

  // Ensure user role exists too
  await prisma.role.upsert({
    where: { id: ROLE_IDS.USER },
    update: {},
    create: {
      id: ROLE_IDS.USER,
      name: 'user',
      description: 'Regular user',
      createdAt: now,
    },
  });
  console.log(`  ✓ User role ready (id: ${ROLE_IDS.USER})`);

  // Check if admin user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingUser) {
    console.log(`  ⚠ Admin user already exists (id: ${existingUser.id})`);

    // Ensure admin has admin role
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: existingUser.id,
          roleId: ROLE_IDS.ADMIN,
        },
      },
    });

    if (!userRole) {
      await prisma.userRole.create({
        data: {
          userId: existingUser.id,
          roleId: ROLE_IDS.ADMIN,
        },
      });
      console.log('  ✓ Admin role assigned to existing user');
    }

    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      hashedPassword,
      isVerified: true,
      status: true,
      language: 0,
      fullName: 'Administrator',
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`  ✓ Admin user created (id: ${adminUser.id})`);

  // Assign admin role
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: ROLE_IDS.ADMIN,
    },
  });

  console.log('  ✓ Admin role assigned');
  console.log(`  📧 Email: ${ADMIN_EMAIL}`);
  console.log(`  🔑 Password: ${ADMIN_PASSWORD}`);
}
