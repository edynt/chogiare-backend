# Chogiare Backend API

Backend API cho hệ thống thương mại điện tử và bán sỉ (wholesale) Chogiare, được xây dựng với NestJS theo Clean Architecture.

## 📋 Tổng quan

Hệ thống backend này cung cấp API hoàn chỉnh cho:
- **B2B/B2C Marketplace**: Hỗ trợ cả bán lẻ và bán sỉ
- **Multi-role System**: Buyer, Seller, Admin
- **Product Management**: Quản lý sản phẩm với tính năng wholesale
- **Order Management**: Xử lý đơn hàng với stock reservation
- **Payment Integration**: Tích hợp nhiều phương thức thanh toán
- **Inventory Management**: Quản lý kho hàng đầy đủ
- **Boost/Promotion**: Hệ thống đẩy sản phẩm
- **Chat & Review**: Chat và đánh giá sản phẩm

## 🏗️ Kiến trúc

Hệ thống được thiết kế theo **Clean Architecture** với các layer:

- **Interfaces Layer**: Controllers, DTOs, Validators
- **Application Layer**: Use Cases, Services
- **Domain Layer**: Entities, Domain Logic, Repository Interfaces
- **Infrastructure Layer**: Prisma, Redis, Supabase

Xem chi tiết: [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x+
- npm hoặc yarn
- Docker & Docker Compose (optional)
- **Supabase PostgreSQL** database (port 5433 hoặc 54322)
- Redis (optional, cho cache và queue)

### Supabase Setup

Hệ thống sử dụng **Supabase PostgreSQL** với port **5433** (hoặc port mặc định của Supabase).

Xem hướng dẫn chi tiết: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd chogiare_backend

# Install dependencies
npm install

# Tạo .env file (tự động)
npm run generate:env

# Hoặc copy từ .env.example
# cp .env.example .env

# Review và update DATABASE_URL nếu cần (mặc định: port 5433)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"

# Merge schema files
npm run merge:schema

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Test database connection
npm run test:db

# Nếu test thành công, tiếp tục:
# Start development server
npm run start:dev
```

### Using Docker

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
```

## 📁 Cấu trúc Project

```
chogiare_backend/
├── src/
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── user/         # User management
│   │   ├── product/       # Product management (Example module)
│   │   ├── category/     # Category management
│   │   ├── store/        # Store management
│   │   ├── order/        # Order management
│   │   ├── cart/         # Cart management
│   │   ├── payment/      # Payment processing
│   │   ├── inventory/    # Inventory management
│   │   └── admin/        # Admin features
│   ├── common/           # Shared utilities
│   ├── config/           # Configuration
│   ├── database/         # Prisma setup
│   ├── cache/            # Redis setup
│   └── queue/            # Queue setup
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── test/                 # Tests
├── docs/                 # API documentation
└── docker/               # Docker files
```

Xem chi tiết: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🗄️ Database Schema

Prisma schema đầy đủ với các tính năng wholesale, được **tách thành các file nhỏ** theo domain để dễ quản lý:

### Schema Structure
```
prisma/schema/
├── base.prisma          # Base configuration
├── enums.prisma         # Tất cả enums
├── users.prisma         # User management
├── wholesale.prisma     # Wholesale features
├── stores.prisma        # Store management
├── categories.prisma    # Category management
├── products.prisma      # Product management
├── inventory.prisma     # Inventory management
├── cart.prisma          # Cart management
├── addresses.prisma     # Address management
├── orders.prisma        # Order management
├── shipping.prisma      # Shipping management
├── reviews.prisma       # Review management
├── boost.prisma         # Boost/Promotion
├── payments.prisma      # Payment & Transaction
├── chat.prisma          # Chat system
└── notifications.prisma # Notifications
```

### Merge Schema
```bash
# Merge tất cả schema files thành schema.prisma
npm run merge:schema
```

### Features
- ✅ Pricing tiers (phân cấp giá)
- ✅ Customer groups (nhóm khách hàng)
- ✅ Warehouses (kho hàng)
- ✅ Inventory tracking (theo dõi tồn kho)
- ✅ Stock management (quản lý kho)

Xem schema: [prisma/schema.prisma](./prisma/schema.prisma)

## 📚 Documentation

- [Quick Start](./QUICK_START.md) - Hướng dẫn setup nhanh với Supabase port 5433
- [Fixes Applied](./FIXES_APPLIED.md) - Tổng hợp các fixes đã áp dụng
- [Prisma 7 Upgrade](./PRISMA_7_UPGRADE.md) - Hướng dẫn upgrade Prisma 7
- [Supabase Setup](./SUPABASE_SETUP.md) - Chi tiết về Supabase configuration
- [Environment Setup](./ENV_SETUP.md) - Cấu hình environment variables
- [Business Analysis](./BUSINESS_ANALYSIS.md) - Phân tích business và requirements
- [Architecture](./ARCHITECTURE.md) - Kiến trúc hệ thống
- [Project Structure](./PROJECT_STRUCTURE.md) - Cấu trúc thư mục
- [Schema Management](./SCHEMA_MANAGEMENT.md) - Quản lý Prisma schema
- [Deployment Guide](./DEPLOYMENT.md) - Hướng dẫn deploy
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Hướng dẫn implement modules
- [Module Template](./MODULE_TEMPLATE.md) - Template để tạo module mới
- [API Documentation](./docs/) - Tài liệu API chi tiết

## 🔑 Key Features

### Wholesale Features
- ✅ Pricing tiers (Retail, Wholesale, VIP)
- ✅ Minimum Order Quantity (MOQ)
- ✅ Customer groups
- ✅ Multi-warehouse support
- ✅ Volume discounts

### Core Features
- ✅ Authentication & Authorization (JWT)
- ✅ Product Management
- ✅ Category Management
- ✅ Store Management
- ✅ Order Management
- ✅ Cart Management
- ✅ Payment Integration (MoMo, ZaloPay, Stripe, PayPal)
- ✅ Shipping Tracking
- ✅ Inventory Management
- ✅ Stock Alerts
- ✅ Reviews & Ratings
- ✅ Chat System
- ✅ Boost/Promotion System
- ✅ Notifications
- ✅ File Upload (Supabase Storage)
- ✅ Admin Dashboard

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: Prisma 7 (latest với provider `"prisma-client"`)
- **Database**: Supabase PostgreSQL (port 5433)
- **Cache**: Redis
- **Queue**: Redis (BullMQ)
- **Storage**: Supabase Storage
- **Auth**: JWT + Supabase Auth (optional)

> **Note**: Prisma 7 sử dụng provider mới `"prisma-client"` thay vì `"prisma-client-js"`. Xem [PRISMA_7_UPGRADE.md](./PRISMA_7_UPGRADE.md) để biết thêm chi tiết.

## 📝 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Đăng xuất

### Products
- `GET /products` - Danh sách sản phẩm
- `GET /products/:id` - Chi tiết sản phẩm
- `POST /products` - Tạo sản phẩm (Seller)
- `PUT /products/:id` - Cập nhật sản phẩm (Seller)
- `DELETE /products/:id` - Xóa sản phẩm (Seller)

### Orders
- `GET /orders` - Danh sách đơn hàng
- `GET /orders/:id` - Chi tiết đơn hàng
- `POST /orders` - Tạo đơn hàng
- `PATCH /orders/:id/status` - Cập nhật trạng thái đơn hàng

Xem đầy đủ: [docs/](./docs/)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose up -d
```

## 📦 Deployment

Xem hướng dẫn chi tiết: [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy
```bash
# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/main.js --name chogiare-backend
```

## 🔒 Security

- JWT authentication
- Role-based access control (RBAC)
- Input validation
- SQL injection protection (Prisma)
- XSS protection
- CORS configuration
- Rate limiting
- HTTPS required in production

## 📊 Monitoring

- **Health check endpoint**: `/api/health` - Check database connection
- Structured logging (JSON)
- Error tracking (Sentry optional)
- Metrics (Prometheus + Grafana)

### Test Database Connection

```bash
# Test connection với script
npm run test:db

# Hoặc check health endpoint
curl http://localhost:3000/api/health
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

Backend team - Chogiare Platform

## 📞 Support

- Documentation: [docs/](./docs/)
- Issues: GitHub Issues
- Email: support@chogiare.com

## 🎯 Roadmap

- [ ] Microservices architecture (future)
- [ ] GraphQL API (optional)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile app API optimization

---

**Built with ❤️ using NestJS and Clean Architecture**


