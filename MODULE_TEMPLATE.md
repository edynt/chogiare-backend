# Module Template - Clean Architecture Pattern

Hướng dẫn tạo module mới theo Clean Architecture pattern đã được thiết lập.

## Cấu trúc Module

```
modules/
  └── [module-name]/
      ├── domain/
      │   ├── entities/
      │   │   └── [entity].entity.ts
      │   ├── repositories/
      │   │   └── [repository].repository.interface.ts
      │   └── services/
      │       └── [domain-service].service.ts
      ├── application/
      │   ├── use-cases/
      │   │   ├── create-[entity].use-case.ts
      │   │   ├── get-[entity].use-case.ts
      │   │   ├── list-[entities].use-case.ts
      │   │   ├── update-[entity].use-case.ts
      │   │   └── delete-[entity].use-case.ts
      │   ├── services/
      │   │   └── [application-service].service.ts
      │   └── dto/
      │       ├── create-[entity].dto.ts
      │       ├── update-[entity].dto.ts
      │       └── [entity]-filters.dto.ts
      ├── infrastructure/
      │   ├── repositories/
      │   │   └── [repository].repository.ts
      │   └── adapters/
      │       └── [adapter].adapter.ts
      └── interfaces/
          ├── controllers/
          │   └── [entity].controller.ts
          ├── dto/
          │   └── [entity]-response.dto.ts
          └── validators/
              └── [entity].validator.ts
```

## Ví dụ: Tạo Category Module

### 1. Domain Layer

#### `domain/entities/category.entity.ts`
```typescript
export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly image: string | null,
    public readonly parentId: string | null,
    public readonly productCount: number,
    public readonly isActive: boolean,
    public readonly createdAt: bigint,
  ) {}

  // Domain methods
  hasChildren(): boolean {
    return this.productCount > 0;
  }
}
```

#### `domain/repositories/category.repository.interface.ts`
```typescript
import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findMany(filters: CategoryFilters): Promise<{ items: Category[]; total: number }>;
  create(data: CreateCategoryData): Promise<Category>;
  update(id: string, data: UpdateCategoryData): Promise<Category>;
  delete(id: string): Promise<void>;
  findTree(): Promise<Category[]>;
}

export interface CategoryFilters {
  parentId?: string | null;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  isActive?: boolean;
}
```

### 2. Application Layer

#### `application/use-cases/create-category.use-case.ts`
```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: CreateCategoryDto): Promise<Category> {
    // Check slug uniqueness
    const existing = await this.categoryRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.categoryRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    return this.categoryRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      image: dto.image,
      parentId: dto.parentId || null,
    });
  }
}
```

#### `application/dto/create-category.dto.ts`
```typescript
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
```

### 3. Infrastructure Layer

#### `infrastructure/repositories/category.repository.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ICategoryRepository,
  CategoryFilters,
  CreateCategoryData,
  UpdateCategoryData,
} from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) return null;
    return this.toDomain(category);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) return null;
    return this.toDomain(category);
  }

  async findMany(filters: CategoryFilters): Promise<{
    items: Category[];
    total: number;
  }> {
    const where: any = {};
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: { children: true },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((c) => this.toDomain(c)),
      total,
    };
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
        productCount: 0,
        isActive: true,
        createdAt: BigInt(Date.now()),
      },
    });

    return this.toDomain(category);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedAt: BigInt(Date.now()),
      },
    });

    return this.toDomain(category);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }

  async findTree(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });

    return categories.map((c) => this.toDomain(c));
  }

  private toDomain(prismaCategory: any): Category {
    return new Category(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.slug,
      prismaCategory.description,
      prismaCategory.image,
      prismaCategory.parentId,
      prismaCategory.productCount,
      prismaCategory.isActive,
      prismaCategory.createdAt,
    );
  }
}
```

### 4. Interfaces Layer

#### `interfaces/controllers/category.controller.ts`
```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CreateCategoryDto } from '../../application/dto/create-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';

@Controller('v1/categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.createCategoryUseCase.execute(dto);
    return {
      status: 'success',
      message: 'Category created successfully',
      data: CategoryResponseDto.fromDomain(category),
    };
  }

  @Get()
  async list(@Query() query: any) {
    const result = await this.listCategoriesUseCase.execute(query);
    return {
      status: 'success',
      data: {
        items: result.items.map((c) => CategoryResponseDto.fromDomain(c)),
        total: result.total,
      },
    };
  }

  @Get('tree')
  async getTree() {
    const categories = await this.listCategoriesUseCase.getTree();
    return {
      status: 'success',
      data: categories.map((c) => CategoryResponseDto.fromDomain(c)),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const category = await this.getCategoryUseCase.execute(id);
    return {
      status: 'success',
      data: CategoryResponseDto.fromDomain(category),
    };
  }
}
```

#### `interfaces/dto/category-response.dto.ts`
```typescript
import { Category } from '../../domain/entities/category.entity';

export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  productCount: number;
  isActive: boolean;
  children?: CategoryResponseDto[];
  createdAt: string;

  static fromDomain(category: Category, includeChildren = false): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.description = category.description;
    dto.image = category.image;
    dto.parentId = category.parentId;
    dto.productCount = category.productCount;
    dto.isActive = category.isActive;
    dto.createdAt = category.createdAt.toString();
    
    // Include children if needed
    if (includeChildren && (category as any).children) {
      dto.children = (category as any).children.map((c: Category) =>
        CategoryResponseDto.fromDomain(c, false),
      );
    }

    return dto;
  }
}
```

### 5. Module File

#### `category.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { CategoryController } from './interfaces/controllers/category.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryController],
  providers: [
    {
      provide: 'ICategoryRepository',
      useClass: CategoryRepository,
    },
    CreateCategoryUseCase,
    GetCategoryUseCase,
    ListCategoriesUseCase,
  ],
  exports: [
    'ICategoryRepository',
    GetCategoryUseCase,
    ListCategoriesUseCase,
  ],
})
export class CategoryModule {}
```

## Best Practices

1. **Dependency Injection**: Luôn inject interfaces, không inject implementations trực tiếp
2. **Error Handling**: Sử dụng NestJS exceptions (NotFoundException, ConflictException, etc.)
3. **Validation**: Sử dụng class-validator decorators trong DTOs
4. **Domain Logic**: Đặt business logic trong domain entities, không trong use cases
5. **Repository Pattern**: Tất cả database access qua repository interface
6. **Use Cases**: Mỗi use case chỉ làm 1 việc, dễ test và maintain
7. **DTOs**: Tách biệt DTOs cho request và response
8. **Guards**: Sử dụng guards cho authentication và authorization

## Checklist khi tạo module mới

- [ ] Domain entity với business logic
- [ ] Repository interface (Port)
- [ ] Repository implementation (Adapter)
- [ ] Use cases cho các operations
- [ ] DTOs với validation
- [ ] Controller với proper guards
- [ ] Response DTOs
- [ ] Module file với proper exports
- [ ] Unit tests cho use cases
- [ ] Integration tests cho controller

