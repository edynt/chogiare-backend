import { PrismaClient } from '@prisma/client';

interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  children?: Omit<CategoryData, 'children'>[];
}

// Category data with hierarchy (parent → children)
const CATEGORIES: CategoryData[] = [
  {
    name: 'Thời trang nam',
    slug: 'thoi-trang-nam',
    description: 'Quần áo, giày dép và phụ kiện dành cho nam',
    displayOrder: 1,
    children: [
      {
        name: 'Áo nam',
        slug: 'ao-nam',
        description: 'Áo thun, áo sơ mi, áo khoác nam',
        displayOrder: 1,
      },
      {
        name: 'Quần nam',
        slug: 'quan-nam',
        description: 'Quần jean, quần kaki, quần short nam',
        displayOrder: 2,
      },
      {
        name: 'Giày nam',
        slug: 'giay-nam',
        description: 'Giày thể thao, giày da, dép nam',
        displayOrder: 3,
      },
      {
        name: 'Phụ kiện nam',
        slug: 'phu-kien-nam',
        description: 'Thắt lưng, ví, đồng hồ nam',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Thời trang nữ',
    slug: 'thoi-trang-nu',
    description: 'Quần áo, giày dép và phụ kiện dành cho nữ',
    displayOrder: 2,
    children: [
      {
        name: 'Áo nữ',
        slug: 'ao-nu',
        description: 'Áo thun, áo sơ mi, áo kiểu nữ',
        displayOrder: 1,
      },
      {
        name: 'Quần nữ',
        slug: 'quan-nu',
        description: 'Quần jean, quần tây, quần short nữ',
        displayOrder: 2,
      },
      {
        name: 'Váy - Đầm',
        slug: 'vay-dam',
        description: 'Váy, đầm công sở, đầm dự tiệc',
        displayOrder: 3,
      },
      {
        name: 'Giày nữ',
        slug: 'giay-nu',
        description: 'Giày cao gót, giày thể thao, dép nữ',
        displayOrder: 4,
      },
      { name: 'Túi xách', slug: 'tui-xach', description: 'Túi xách, balo, ví nữ', displayOrder: 5 },
    ],
  },
  {
    name: 'Điện thoại & Phụ kiện',
    slug: 'dien-thoai-phu-kien',
    description: 'Điện thoại di động và phụ kiện',
    displayOrder: 3,
    children: [
      {
        name: 'Điện thoại',
        slug: 'dien-thoai',
        description: 'Smartphone, điện thoại phổ thông',
        displayOrder: 1,
      },
      {
        name: 'Máy tính bảng',
        slug: 'may-tinh-bang',
        description: 'iPad, tablet Android',
        displayOrder: 2,
      },
      {
        name: 'Phụ kiện điện thoại',
        slug: 'phu-kien-dien-thoai',
        description: 'Ốp lưng, sạc, tai nghe',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Laptop & Máy tính',
    slug: 'laptop-may-tinh',
    description: 'Laptop, PC và linh kiện máy tính',
    displayOrder: 4,
    children: [
      {
        name: 'Laptop',
        slug: 'laptop',
        description: 'Laptop văn phòng, gaming, workstation',
        displayOrder: 1,
      },
      {
        name: 'PC - Máy tính bàn',
        slug: 'pc-may-tinh-ban',
        description: 'PC gaming, PC văn phòng',
        displayOrder: 2,
      },
      {
        name: 'Linh kiện máy tính',
        slug: 'linh-kien-may-tinh',
        description: 'CPU, RAM, VGA, SSD',
        displayOrder: 3,
      },
      {
        name: 'Phụ kiện máy tính',
        slug: 'phu-kien-may-tinh',
        description: 'Chuột, bàn phím, màn hình',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Đồ gia dụng',
    slug: 'do-gia-dung',
    description: 'Đồ dùng gia đình, nhà bếp',
    displayOrder: 5,
    children: [
      {
        name: 'Đồ dùng nhà bếp',
        slug: 'do-dung-nha-bep',
        description: 'Nồi, chảo, dao, thớt',
        displayOrder: 1,
      },
      {
        name: 'Thiết bị nhà bếp',
        slug: 'thiet-bi-nha-bep',
        description: 'Nồi cơm, lò vi sóng, máy xay',
        displayOrder: 2,
      },
      {
        name: 'Đồ dùng phòng ngủ',
        slug: 'do-dung-phong-ngu',
        description: 'Chăn, ga, gối, nệm',
        displayOrder: 3,
      },
      {
        name: 'Đồ dùng phòng tắm',
        slug: 'do-dung-phong-tam',
        description: 'Khăn tắm, vòi sen, kệ',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Sức khỏe & Làm đẹp',
    slug: 'suc-khoe-lam-dep',
    description: 'Mỹ phẩm, chăm sóc sức khỏe',
    displayOrder: 6,
    children: [
      {
        name: 'Mỹ phẩm',
        slug: 'my-pham',
        description: 'Son, phấn, kem nền, mascara',
        displayOrder: 1,
      },
      {
        name: 'Chăm sóc da',
        slug: 'cham-soc-da',
        description: 'Sữa rửa mặt, kem dưỡng, serum',
        displayOrder: 2,
      },
      {
        name: 'Chăm sóc tóc',
        slug: 'cham-soc-toc',
        description: 'Dầu gội, dầu xả, serum tóc',
        displayOrder: 3,
      },
      {
        name: 'Nước hoa',
        slug: 'nuoc-hoa',
        description: 'Nước hoa nam, nữ, unisex',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Thể thao & Dã ngoại',
    slug: 'the-thao-da-ngoai',
    description: 'Dụng cụ thể thao, đồ dã ngoại',
    displayOrder: 7,
    children: [
      {
        name: 'Đồ thể thao',
        slug: 'do-the-thao',
        description: 'Quần áo, giày thể thao',
        displayOrder: 1,
      },
      {
        name: 'Dụng cụ thể thao',
        slug: 'dung-cu-the-thao',
        description: 'Vợt, bóng, găng tay',
        displayOrder: 2,
      },
      {
        name: 'Đồ dã ngoại',
        slug: 'do-da-ngoai',
        description: 'Lều, balo, đèn pin',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Đồ chơi & Trẻ em',
    slug: 'do-choi-tre-em',
    description: 'Đồ chơi, quần áo trẻ em',
    displayOrder: 8,
    children: [
      {
        name: 'Đồ chơi',
        slug: 'do-choi',
        description: 'Đồ chơi giáo dục, mô hình, búp bê',
        displayOrder: 1,
      },
      {
        name: 'Quần áo trẻ em',
        slug: 'quan-ao-tre-em',
        description: 'Quần áo bé trai, bé gái',
        displayOrder: 2,
      },
      {
        name: 'Đồ dùng em bé',
        slug: 'do-dung-em-be',
        description: 'Bỉm, sữa, xe đẩy',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Sách & Văn phòng phẩm',
    slug: 'sach-van-phong-pham',
    description: 'Sách, dụng cụ học tập, văn phòng',
    displayOrder: 9,
    children: [
      {
        name: 'Sách',
        slug: 'sach',
        description: 'Sách văn học, sách kỹ năng, truyện',
        displayOrder: 1,
      },
      {
        name: 'Văn phòng phẩm',
        slug: 'van-phong-pham',
        description: 'Bút, vở, giấy, kẹp',
        displayOrder: 2,
      },
      {
        name: 'Dụng cụ học tập',
        slug: 'dung-cu-hoc-tap',
        description: 'Balo, hộp bút, thước',
        displayOrder: 3,
      },
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
 * Seed categories with hierarchy
 */
export async function seedCategories(prisma: PrismaClient): Promise<void> {
  console.log('📁 Seeding categories...');

  const now = BigInt(Date.now());
  let createdCount = 0;
  let skippedCount = 0;

  for (const category of CATEGORIES) {
    // Check if parent category exists
    const existingParent = await prisma.category.findUnique({
      where: { slug: category.slug },
    });

    let parentId: number;

    if (existingParent) {
      parentId = existingParent.id;
      skippedCount++;
      console.log(`  ⚠ "${category.name}" already exists`);
    } else {
      // Create parent category
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

    // Create children if any
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
