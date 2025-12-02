# Project Structure - Chogiare Backend

## Cấu trúc thư mục hoàn chỉnh

```
chogiare_backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── common/                          # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── global-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── refresh-token.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-int.pipe.ts
│   │   ├── interfaces/
│   │   │   ├── pagination.interface.ts
│   │   │   ├── response.interface.ts
│   │   │   └── user-request.interface.ts
│   │   ├── utils/
│   │   │   ├── hash.util.ts
│   │   │   ├── jwt.util.ts
│   │   │   ├── slug.util.ts
│   │   │   └── date.util.ts
│   │   └── constants/
│   │       ├── error-codes.constant.ts
│   │       └── app.constant.ts
│   │
│   ├── config/                          # Configuration
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── supabase.config.ts
│   │   └── app.config.ts
│   │
│   ├── database/                         # Database setup
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── migrations/
│   │
│   ├── cache/                            # Cache setup
│   │   ├── cache.module.ts
│   │   ├── cache.service.ts
│   │   └── cache-key.factory.ts
│   │
│   ├── queue/                            # Queue setup
│   │   ├── queue.module.ts
│   │   ├── queue.service.ts
│   │   └── processors/
│   │       ├── notification.processor.ts
│   │       ├── stock.processor.ts
│   │       └── email.processor.ts
│   │
│   ├── modules/                          # Feature modules
│   │   │
│   │   ├── auth/                         # Authentication
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── user.repository.interface.ts
│   │   │   │   └── services/
│   │   │   │       └── password.service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   ├── register.use-case.ts
│   │   │   │   │   ├── refresh-token.use-case.ts
│   │   │   │   │   └── logout.use-case.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── auth.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       ├── register.dto.ts
│   │   │   │       └── refresh-token.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── user.repository.ts
│   │   │   │   └── adapters/
│   │   │   │       └── jwt.adapter.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── auth.controller.ts
│   │   │       ├── dto/
│   │   │       │   └── auth-response.dto.ts
│   │   │       └── validators/
│   │   │           └── auth.validator.ts
│   │   │
│   │   ├── user/                         # User Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── user.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── get-user.use-case.ts
│   │   │   │   │   ├── update-user.use-case.ts
│   │   │   │   │   └── delete-user.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── user.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── user.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── user.controller.ts
│   │   │       └── dto/
│   │   │           └── user-response.dto.ts
│   │   │
│   │   ├── product/                      # Product Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── product.entity.ts
│   │   │   │   │   └── product-image.entity.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── product.repository.interface.ts
│   │   │   │   └── services/
│   │   │   │       ├── pricing.service.ts
│   │   │   │       └── stock.service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-product.use-case.ts
│   │   │   │   │   ├── update-product.use-case.ts
│   │   │   │   │   ├── get-product.use-case.ts
│   │   │   │   │   ├── list-products.use-case.ts
│   │   │   │   │   └── delete-product.use-case.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── product.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-product.dto.ts
│   │   │   │       └── update-product.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── product.repository.ts
│   │   │   │   └── adapters/
│   │   │   │       └── pricing.adapter.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── product.controller.ts
│   │   │       ├── dto/
│   │   │       │   └── product-response.dto.ts
│   │   │       └── validators/
│   │   │           └── product.validator.ts
│   │   │
│   │   ├── category/                     # Category Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── category.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── category.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-category.use-case.ts
│   │   │   │   │   └── list-categories.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── category.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── category.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── category.controller.ts
│   │   │       └── dto/
│   │   │           └── category-response.dto.ts
│   │   │
│   │   ├── store/                        # Store Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── store.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── store.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-store.use-case.ts
│   │   │   │   │   └── update-store.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── store.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── store.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── store.controller.ts
│   │   │       └── dto/
│   │   │           └── store-response.dto.ts
│   │   │
│   │   ├── order/                        # Order Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── order.entity.ts
│   │   │   │   │   └── order-item.entity.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── order.repository.interface.ts
│   │   │   │   └── services/
│   │   │   │       ├── order-calculation.service.ts
│   │   │   │       └── stock-reservation.service.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-order.use-case.ts
│   │   │   │   │   ├── update-order-status.use-case.ts
│   │   │   │   │   └── cancel-order.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── order.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── order.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── order.controller.ts
│   │   │       └── dto/
│   │   │           └── order-response.dto.ts
│   │   │
│   │   ├── cart/                         # Cart Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── cart.entity.ts
│   │   │   │   │   └── cart-item.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── cart.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── add-to-cart.use-case.ts
│   │   │   │   │   └── remove-from-cart.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── cart.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── cart.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── cart.controller.ts
│   │   │       └── dto/
│   │   │           └── cart-response.dto.ts
│   │   │
│   │   ├── payment/                      # Payment Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── transaction.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── transaction.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── create-payment.use-case.ts
│   │   │   │   │   └── process-payment.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── payment.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── transaction.repository.ts
│   │   │   │   └── adapters/
│   │   │   │       ├── momo.adapter.ts
│   │   │   │       ├── zalopay.adapter.ts
│   │   │   │       └── stripe.adapter.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── payment.controller.ts
│   │   │       └── dto/
│   │   │           └── payment-response.dto.ts
│   │   │
│   │   ├── inventory/                   # Inventory Management
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── stock-in-record.entity.ts
│   │   │   │   │   └── stock-alert.entity.ts
│   │   │   │   └── repositories/
│   │   │   │       └── inventory.repository.interface.ts
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── stock-in.use-case.ts
│   │   │   │   │   └── get-inventory.use-case.ts
│   │   │   │   └── dto/
│   │   │   │       └── inventory.dto.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── inventory.repository.ts
│   │   │   └── interfaces/
│   │   │       ├── controllers/
│   │   │       │   └── inventory.controller.ts
│   │   │       └── dto/
│   │   │           └── inventory-response.dto.ts
│   │   │
│   │   └── admin/                       # Admin Features
│   │       ├── domain/
│   │       │   └── entities/
│   │       │       └── admin-stats.entity.ts
│   │       ├── application/
│   │       │   ├── use-cases/
│   │       │   │   ├── approve-product.use-case.ts
│   │       │   │   └── get-dashboard.use-case.ts
│   │       │   └── dto/
│   │       │       └── admin.dto.ts
│   │       └── interfaces/
│   │           ├── controllers/
│   │           │   └── admin.controller.ts
│   │           └── dto/
│   │               └── admin-response.dto.ts
│   │
│   └── shared/                          # Shared modules
│       ├── types/
│       │   └── index.ts
│       └── enums/
│           └── index.ts
│
├── prisma/
│   ├── schema.prisma                    # Prisma schema
│   ├── seed.ts                          # Database seed
│   └── migrations/                      # Migrations
│
├── test/                                # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/                              # Docker files
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── docs/                                # Documentation
│   └── api/                             # API documentation
│
├── .env.example                         # Environment variables example
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## Module Dependencies

```
app.module
├── config.module
├── database.module (Prisma)
├── cache.module (Redis)
├── queue.module (BullMQ)
├── auth.module
│   └── user.module (dependency)
├── user.module
├── product.module
│   ├── category.module (dependency)
│   └── store.module (dependency)
├── category.module
├── store.module
│   └── user.module (dependency)
├── order.module
│   ├── product.module (dependency)
│   ├── store.module (dependency)
│   └── cart.module (dependency)
├── cart.module
│   └── product.module (dependency)
├── payment.module
│   └── order.module (dependency)
├── inventory.module
│   └── product.module (dependency)
└── admin.module
    └── (depends on all modules)
```

## Key Principles

1. **Separation of Concerns**: Mỗi layer có trách nhiệm riêng
2. **Dependency Inversion**: Depend on abstractions, not concretions
3. **Single Responsibility**: Mỗi class/module có 1 trách nhiệm
4. **Open/Closed**: Open for extension, closed for modification
5. **DRY**: Don't Repeat Yourself
6. **KISS**: Keep It Simple, Stupid


