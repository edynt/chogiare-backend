# Environment Variables Setup

## Database Configuration - Supabase với Port 5433

### Format DATABASE_URL

```
postgresql://[user]:[password]@[host]:[port]/[database]?[params]
```

### Supabase Local (Port 5433)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"
```

### Supabase Cloud

```env
# Session Mode (cho queries)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
DATABASE_SSL="true"

# Transaction Mode (cho migrations) - Port 6543
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Complete .env File

Tạo file `.env` trong root directory với nội dung:

```env
# ============================================
# DATABASE - SUPABASE
# ============================================
# Supabase Local với port 5433
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"

# Connection Pool Settings
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"
DATABASE_POOL_IDLE_TIMEOUT="30000"

# ============================================
# REDIS
# ============================================
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key"
REFRESH_TOKEN_EXPIRES_IN="7d"

# ============================================
# SUPABASE API
# ============================================
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_KEY="your-supabase-service-key"

# ============================================
# APPLICATION
# ============================================
NODE_ENV="development"
PORT=3000
API_PREFIX="api"
CORS_ORIGIN="*"
APP_NAME="Chogiare Backend"

# ============================================
# PAYMENT GATEWAYS (Optional)
# ============================================
MOMO_PARTNER_CODE=""
MOMO_ACCESS_KEY=""
MOMO_SECRET_KEY=""

ZALOPAY_APP_ID=""
ZALOPAY_KEY1=""
ZALOPAY_KEY2=""

STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ============================================
# EMAIL (Optional)
# ============================================
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

## Quick Setup

### 1. Tạo .env file

```bash
cp ENV_SETUP.md .env
# Hoặc tạo thủ công
touch .env
```

### 2. Cấu hình DATABASE_URL cho port 5433

```bash
# Edit .env file
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
```

### 3. Test connection

```bash
npm run test:db
```

## Lưu ý về Port 5433

Nếu bạn đang sử dụng Supabase Local, port mặc định là **54322**, không phải 5433.

Để sử dụng port **5433**, bạn có các options:

### Option 1: Map port trong Supabase

1. Stop Supabase: `supabase stop`
2. Edit `.supabase/config.toml` hoặc docker-compose
3. Change port mapping từ 54322 → 5433
4. Start lại: `supabase start`

### Option 2: Sử dụng PostgreSQL trực tiếp

Nếu bạn đang chạy PostgreSQL trực tiếp trên port 5433:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
```

### Option 3: Sử dụng Supabase port mặc định

Nếu không cần port 5433, sử dụng port mặc định:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public"
```

## Verification

Sau khi setup, verify connection:

```bash
# Test database connection
npm run test:db

# Check health endpoint
curl http://localhost:3000/api/health

# Open Prisma Studio
npm run prisma:studio
```

