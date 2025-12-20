# Chợ Giá Rẻ - Wholesale Marketplace Backend

A comprehensive NestJS-based backend API for a Vietnamese wholesale marketplace platform, enabling seamless interactions between buyers and sellers with features for product management, order processing, payments, inventory, and real-time communication.

**Status:** Active Development | **Version:** 1.0.0

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 12+ (local or remote)
- Redis (optional, for caching)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd chogiare_backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL and other configs

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (optional)
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3000/api` by default.

API documentation: `http://localhost:3000/api/docs` (Swagger UI)

---

## Project Overview

### What is Chợ Giá Rẻ?
A wholesale marketplace connecting buyers and sellers for bulk purchases. Features include:
- **Multi-role system** - Buyers, sellers, and admin users
- **Product catalog** - Manage products with inventory tracking
- **Order management** - Create, track, and fulfill orders
- **Payment processing** - Multiple payment method support (MoMo, ZaloPay, Stripe, PayPal)
- **Real-time chat** - Direct messaging between buyers and sellers
- **Promotions** - Boost and promote products
- **Admin dashboard** - Manage users, products, orders, and analytics

### Architecture
Built on **Clean Architecture** with **Domain-Driven Design** principles:
- Layered structure (Interfaces → Application → Domain → Infrastructure)
- Module-based organization
- Dependency injection via NestJS
- Type-safe with TypeScript

---

## Project Structure

```
src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap & Swagger setup
├── common/                    # Shared infrastructure
│   ├── config/               # App configuration
│   ├── decorators/           # Custom decorators
│   ├── filters/              # Exception handling
│   ├── guards/               # Authentication/authorization
│   ├── interceptors/         # Request/response handling
│   └── constants/            # Constants
├── modules/                  # Feature modules
│   ├── auth/                # Authentication
│   ├── product/             # Product management
│   ├── order/               # Order processing
│   ├── payment/             # Payments & wallet
│   ├── cart/                # Shopping cart
│   ├── inventory/           # Stock management
│   ├── chat/                # Messaging system
│   ├── notification/        # Notifications
│   ├── admin/               # Admin features
│   └── [other modules]
└── prisma/                   # Database schema & migrations
```

---

## Core Modules

| Module | Purpose | Key Endpoints |
|--------|---------|---------------|
| **Auth** | User authentication & authorization | `/auth/login`, `/auth/register`, `/auth/me` |
| **Product** | Product catalog & management | `/products`, `/seller/products` |
| **Order** | Order creation & tracking | `/orders`, `/orders/:id` |
| **Payment** | Payment processing & wallet | `/payments/deposit`, `/payments/order/:id` |
| **Cart** | Shopping cart management | `/cart`, `/cart/items` |
| **Inventory** | Stock tracking & management | `/inventory/stock-in`, `/inventory/adjust` |
| **Chat** | Real-time messaging (WebSocket) | `/chat/conversations`, WebSocket events |
| **Notification** | User notifications | `/notifications` |
| **Admin** | Admin dashboard & management | `/admin/products`, `/admin/analytics` |

---

## Development Commands

```bash
# Development
npm run dev                   # Start with hot-reload

# Building
npm run build               # Compile TypeScript

# Code Quality
npm run lint                # ESLint
npm run format              # Prettier formatting
npm run lint                # Auto-fix issues

# Testing
npm run test                # Unit tests
npm run test:watch          # Watch mode
npm run test:cov            # Coverage report
npm run test:e2e            # E2E tests

# Database
npm run prisma:generate     # Generate client
npm run prisma:migrate      # Run migrations
npm run prisma:studio       # UI for database
npm run prisma:seed         # Seed data

# Production
npm run build && npm start  # Build & run
```

---

## Authentication

### User Roles
- **buyer** - Purchase products
- **seller** - Sell products and manage stores
- **admin** - System administration

### JWT Tokens
- **Access Token** - Short-lived (15 min - 1 hour), used for API requests
- **Refresh Token** - Long-lived (7-30 days), stored in database, used to get new access token

### Protected Routes
```typescript
// Public (no auth required)
@Public()
@Post('auth/login')

// Protected (auth required)
@UseGuards(JwtAuthGuard)
@Get('orders/my')

// Role-based (admin only)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN)
@Get('admin/users')
```

---

## API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed",
  "data": { /* response data */ },
  "error": null
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  },
  "data": null
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

## Database

### Technology
- **Primary:** PostgreSQL
- **ORM:** Prisma
- **Migrations:** Prisma migrations

### Key Models
- `User` - User accounts with roles
- `Product` - Product catalog
- `Order` - Customer orders
- `Payment/Transaction` - Financial records
- `Store` - Seller stores
- `Inventory` - Stock tracking
- `Chat` - Messaging system
- `Review` - Ratings and reviews

### Running Migrations
```bash
# Create migration
npm run prisma:migrate -- --name add_new_field

# Apply migrations
npm run prisma:migrate

# View schema in UI
npm run prisma:studio
```

---

## Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chogiare

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# App
APP_PORT=3000
APP_NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email (optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Storage (S3 optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY=***
AWS_SECRET_KEY=***
AWS_S3_BUCKET=your-bucket
```

---

## Common Tasks

### Add New Feature Module
1. Create folder: `src/modules/feature-name/`
2. Implement layers:
   - `domain/entities/` - Business models
   - `domain/repositories/` - Interfaces
   - `application/services/` - Business logic
   - `application/dto/` - Data transfer objects
   - `infrastructure/repositories/` - Implementation
   - `interfaces/controllers/` - HTTP endpoints
   - `feature-name.module.ts` - Module registration
3. Import in `app.module.ts`

### Handle Authentication
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### Validate Input
```typescript
@Post('products')
createProduct(@Body() dto: CreateProductDto) {
  // DTO validation happens automatically
}
```

### Query Database with Pagination
```typescript
const { page = 1, pageSize = 10, search } = query;
const skip = (page - 1) * pageSize;

const [items, total] = await Promise.all([
  this.prisma.product.findMany({ skip, take: pageSize }),
  this.prisma.product.count(),
]);

return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
```

---

## Documentation

See `./docs/` for detailed documentation:
- **project-overview-pdr.md** - Project overview and requirements
- **code-standards.md** - Code organization, naming conventions, patterns
- **system-architecture.md** - Architecture design, data flows, deployment
- **codebase-summary.md** - Quick reference to modules and structure

---

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

Target coverage: >80% for critical paths

---

## Deployment

### Environment Setup
- **Development** - Local PostgreSQL
- **Staging** - Cloud PostgreSQL
- **Production** - Cloud PostgreSQL (replicated), load balancer

### Docker (Optional)
```bash
docker build -t chogiare-backend:latest .
docker run -p 3000:3000 chogiare-backend:latest
```

### Production Build
```bash
npm run build
npm run start:prod
```

---

## WebSocket (Real-time Chat)

### Connection
```typescript
// Client-side
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

// Listen for messages
socket.on('message:received', (data) => {
  console.log('New message:', data);
});
```

### Events
- `message:send` - Send message
- `message:received` - Receive message
- `user:typing` - Typing indicator
- `conversation:updated` - Conversation changed

---

## Performance

### Caching
- In-memory caching for frequently accessed data
- Redis for distributed caching (optional)
- Standard cache keys: `products:list`, `categories:tree`, etc.

### Pagination
- Always paginate large result sets
- Default: page 1, pageSize 10
- Max pageSize: 100

### Database Optimization
- Proper indexing on foreign keys and search fields
- Select only needed fields
- Use transactions for atomic operations

---

## Security

- JWT tokens for authentication
- bcrypt password hashing
- Input validation via DTOs
- CORS properly configured
- Rate limiting (recommended for production)
- SQL injection prevention via ORM

---

## Troubleshooting

### Database Connection Failed
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Test connection: npm run prisma:studio
```

### Port Already in Use
```bash
# Change port in .env (APP_PORT=3001)
# Or kill process: lsof -ti:3000 | xargs kill -9
```

### Missing Dependencies
```bash
# Reinstall
rm -rf node_modules
npm install
npm run prisma:generate
```

### Swagger Not Loading
- Ensure NODE_ENV != production
- Check http://localhost:3000/api/docs
- Clear browser cache

---

## Team & Contribution

**Current Phase:** Core features implementation

**Next Steps:**
1. Complete missing API endpoints (see IMPLEMENTATION_STATUS.md)
2. Add comprehensive test coverage
3. Performance optimization and caching
4. CI/CD pipeline setup
5. Production deployment preparation

See **CLAUDE.md** and `./docs/` for development workflows.

---

## License

MIT

---

## Support

For documentation, see `./docs/`:
- Architecture questions → `system-architecture.md`
- Code standards → `code-standards.md`
- Module overview → `codebase-summary.md`
- Project requirements → `project-overview-pdr.md`

For implementation status: See `IMPLEMENTATION_STATUS.md`
