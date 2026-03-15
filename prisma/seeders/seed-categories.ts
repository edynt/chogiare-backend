import { PrismaClient } from '@prisma/client';

interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  children?: Omit<CategoryData, 'children'>[];
}

/**
 * Minimal category hierarchy for seed data
 * Covers: fashion (nam/nữ), electronics, beauty
 */
const CATEGORIES: CategoryData[] = [
  {
    name: 'Thời trang nam',
    slug: 'thoi-trang-nam',
    description: 'Quần áo, giày dép và phụ kiện dành cho nam',
    displayOrder: 1,
    children: [
      { name: 'Áo nam', slug: 'ao-nam', description: 'Áo thun, áo sơ mi, áo khoác nam', displayOrder: 1 },
      { name: 'Quần nam', slug: 'quan-nam', description: 'Quần jean, quần kaki, quần short nam', displayOrder: 2 },
      { name: 'Giày nam', slug: 'giay-nam', description: 'Giày thể thao, giày da, dép nam', displayOrder: 3 },
    ],
  },
  {
    name: 'Thời trang nữ',
    slug: 'thoi-trang-nu',
    description: 'Quần áo, giày dép và phụ kiện dành cho nữ',
    displayOrder: 2,
    children: [
      { name: 'Áo nữ', slug: 'ao-nu', description: 'Áo thun, áo sơ mi, áo kiểu nữ', displayOrder: 1 },
      { name: 'Váy - Đầm', slug: 'vay-dam', description: 'Váy, đầm công sở, đầm dự tiệc', displayOrder: 2 },
    ],
  },
  {
    name: 'Điện tử & Công nghệ',
    slug: 'dien-tu-cong-nghe',
    description: 'Điện thoại, laptop và phụ kiện',
    displayOrder: 3,
    children: [
      { name: 'Điện thoại', slug: 'dien-thoai', description: 'Smartphone, điện thoại phổ thông', displayOrder: 1 },
      { name: 'Laptop', slug: 'laptop', description: 'Laptop văn phòng, gaming, workstation', displayOrder: 2 },
    ],
  },
  {
    name: 'Sức khỏe & Làm đẹp',
    slug: 'suc-khoe-lam-dep',
    description: 'Mỹ phẩm, chăm sóc sức khỏe',
    displayOrder: 4,
    children: [
      { name: 'Chăm sóc da', slug: 'cham-soc-da', description: 'Sữa rửa mặt, kem dưỡng, serum', displayOrder: 1 },
      { name: 'Mỹ phẩm', slug: 'my-pham', description: 'Son, phấn, kem nền, mascara', displayOrder: 2 },
    ],
  },
  {
    name: 'Khác',
    slug: 'khac',
    description: 'Các sản phẩm khác',
    displayOrder: 99,
  },
];

/**
 * Seed categories with parent-child hierarchy
 */
export async function seedCategories(prisma: PrismaClient): Promise<void> {
  console.log('📁 Seeding categories...');

  const now = BigInt(Date.now());
  let createdCount = 0;
  let skippedCount = 0;

  for (const category of CATEGORIES) {
    const existingParent = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    let parentId: number;

    if (existingParent) {
      parentId = existingParent.id;
      skippedCount++;
      console.log(`  ⚠ "${category.name}" already exists`);
    } else {
      const parent = await prisma.category.create({
        data: {
          name: category.name,
          slug: category.slug,
          description: category.description || null,
          displayOrder: category.displayOrder,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      parentId = parent.id;
      createdCount++;
      console.log(`  ✓ Created "${category.name}"`);
    }

    if (category.children) {
      for (const child of category.children) {
        const existingChild = await prisma.category.findUnique({
          where: { slug: child.slug },
        });

        if (existingChild) {
          skippedCount++;
        } else {
          await prisma.category.create({
            data: {
              name: child.name,
              slug: child.slug,
              description: child.description || null,
              parentId,
              displayOrder: child.displayOrder,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
          });
          createdCount++;
          console.log(`    ✓ Created "${child.name}"`);
        }
      }
    }
  }

  console.log(`  📊 Summary: ${createdCount} created, ${skippedCount} skipped`);
}
