# Quick Start Guide - Supabase với Port 5433

## Bước 1: Tạo .env file

```bash
# Tạo file .env
cat > .env << 'EOF'
# Database - Supabase với port 5433
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="dev-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
API_PREFIX="api"
CORS_ORIGIN="*"
EOF
```

Hoặc copy từ `ENV_SETUP.md` và chỉnh sửa.

## Bước 2: Setup Supabase với Port 5433

### Nếu dùng Supabase Local:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize (nếu chưa có)
supabase init

# Start Supabase
supabase start

# Note: Supabase local mặc định dùng port 54322
# Để dùng port 5433, bạn cần:
# 1. Stop Supabase: supabase stop
# 2. Edit .supabase/config.toml
# 3. Thay đổi port mapping
```

### Nếu dùng PostgreSQL trực tiếp:

```bash
# Start PostgreSQL trên port 5433
# (tùy vào cách bạn setup PostgreSQL)
```

### Nếu dùng Supabase Cloud:

1. Tạo project tại https://supabase.com
2. Lấy connection string từ Settings > Database
3. Update DATABASE_URL trong .env

## Bước 3: Merge Schema và Generate Prisma Client

```bash
# Merge schema files
npm run merge:schema

# Generate Prisma Client
npm run prisma:generate
```

## Bước 4: Run Migrations

```bash
# Create và apply migrations
npm run prisma:migrate
```

## Bước 5: Test Database Connection

```bash
# Test connection
npm run test:db
```

Bạn sẽ thấy:
```
🔌 Testing database connection...
✅ Database connection successful!
📊 PostgreSQL version: PostgreSQL 15.x
📈 Users in database: 0
✅ All tests passed!
```

## Bước 6: Start Application

```bash
# Install dependencies (nếu chưa)
npm install

# Start development server
npm run start:dev
```

Application sẽ chạy tại: http://localhost:3000/api

## Bước 7: Verify

### Health Check

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

### Prisma Studio

```bash
npm run prisma:studio
```

Mở browser tại: http://localhost:5555

## Troubleshooting

### Lỗi: Connection refused

**Nguyên nhân**: Database chưa chạy hoặc port sai

**Giải pháp**:
```bash
# Check port 5433
lsof -i :5433

# Hoặc check Supabase status
supabase status

# Verify DATABASE_URL trong .env
cat .env | grep DATABASE_URL
```

### Lỗi: Database does not exist

**Nguyên nhân**: Database name sai

**Giải pháp**:
- Supabase Local: database name là `postgres`
- Supabase Cloud: database name là `postgres`
- PostgreSQL trực tiếp: tạo database trước

```sql
CREATE DATABASE chogiare;
```

### Lỗi: Authentication failed

**Nguyên nhân**: Username/password sai

**Giải pháp**:
- Check credentials trong .env
- Supabase Local mặc định: `postgres:postgres`
- Supabase Cloud: lấy từ project settings

## Next Steps

1. ✅ Database connected
2. 📝 Implement Auth Module
3. 📝 Implement các modules còn lại
4. 🧪 Write tests
5. 🚀 Deploy to production

Xem thêm:
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Chi tiết về Supabase setup
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Hướng dẫn implement modules
- [MODULE_TEMPLATE.md](./MODULE_TEMPLATE.md) - Template để tạo module mới

