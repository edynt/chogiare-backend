# Supabase Setup Guide

## Tổng quan

Hệ thống sử dụng **Supabase PostgreSQL** làm database chính. Supabase cung cấp:
- PostgreSQL database (managed)
- Real-time subscriptions
- Storage (cho files/images)
- Authentication (optional, có thể dùng JWT riêng)
- API auto-generation

## Setup Options

### Option 1: Supabase Local (Development)

Supabase cung cấp local development environment với Docker.

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# hoặc npm
npm install -g supabase
```

#### 2. Initialize Supabase

```bash
# Trong project root
supabase init
```

#### 3. Start Supabase Local

```bash
supabase start
```

Sau khi start, bạn sẽ nhận được:
- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Inbucket URL**: http://localhost:54324 (email testing)

#### 4. Configure .env

```env
# Supabase Local
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public"
DATABASE_SSL="false"
```

**Lưu ý**: Port mặc định của Supabase local là **54322**, không phải 5433.

Nếu bạn muốn dùng port **5433**, bạn cần:

1. **Option A**: Sử dụng Supabase với port mapping
```bash
# Stop Supabase
supabase stop

# Edit docker-compose.yml trong .supabase/
# Thay đổi port mapping từ 54322:5432 thành 5433:5432
```

2. **Option B**: Sử dụng PostgreSQL trực tiếp với port 5433
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
```

### Option 2: Supabase Cloud (Production)

#### 1. Tạo Supabase Project

1. Truy cập https://supabase.com
2. Tạo account và project mới
3. Chọn region gần nhất (ví dụ: Southeast Asia - Singapore)

#### 2. Lấy Connection String

1. Vào **Settings** > **Database**
2. Copy **Connection string** (URI)
3. Hoặc sử dụng **Connection pooling** (recommended cho production)

#### 3. Configure .env

```env
# Supabase Cloud - Direct Connection
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
DATABASE_SSL="true"

# Hoặc Transaction Mode (cho migrations)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Lưu ý quan trọng**:
- Port **5432**: Session mode (cho queries thông thường)
- Port **6543**: Transaction mode (cho migrations)
- Luôn dùng **connection pooling** trong production
- Enable SSL (`sslmode=require`)

## Configuration

### .env File

```env
# Database - Supabase
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"

# Connection Pool Settings
DATABASE_POOL_MIN="2"
DATABASE_POOL_MAX="10"
DATABASE_POOL_IDLE_TIMEOUT="30000"

# Supabase API (optional, for Storage/Auth)
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-key"
```

### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[params]
```

**Parameters**:
- `schema=public` - Database schema
- `sslmode=require` - SSL mode (production)
- `pgbouncer=true` - Use connection pooling
- `connection_limit=1` - Connection limit per pool

## Testing Connection

### 1. Test với Script

```bash
node scripts/test-db-connection.js
```

### 2. Test với Prisma Studio

```bash
npm run prisma:studio
```

### 3. Test với Supabase CLI

```bash
# Local
supabase db connect

# Cloud
supabase link --project-ref [project-ref]
```

## Migrations

### Development (Local)

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Apply migration
npx prisma migrate deploy
```

### Production (Cloud)

```bash
# Set DATABASE_URL to transaction mode port (6543)
export DATABASE_URL="postgresql://...:6543/..."

# Deploy migrations
npm run prisma:migrate:deploy

# Reset DATABASE_URL to session mode port (5432)
export DATABASE_URL="postgresql://...:5432/..."
```

## Supabase Features

### 1. Storage (File Upload)

```typescript
// Setup Supabase Storage client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Upload file
const { data, error } = await supabase.storage
  .from('products')
  .upload('image.jpg', file);
```

### 2. Real-time Subscriptions

```typescript
// Subscribe to changes
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'orders' },
    (payload) => console.log('New order:', payload.new)
  )
  .subscribe();
```

### 3. Row Level Security (RLS)

Supabase hỗ trợ RLS policies. Bạn có thể setup trong Supabase Dashboard hoặc qua migrations.

## Troubleshooting

### Connection Refused

```bash
# Check if Supabase is running
supabase status

# Check port
lsof -i :5433
```

### SSL Required Error

```env
# Add sslmode=require
DATABASE_URL="postgresql://...?sslmode=require"
DATABASE_SSL="true"
```

### Connection Pool Exhausted

```env
# Reduce pool size
DATABASE_POOL_MAX="5"
```

### Migration Fails

- Sử dụng transaction mode port (6543) cho migrations
- Check database permissions
- Verify connection string

## Best Practices

1. **Development**: Sử dụng Supabase Local
2. **Staging**: Sử dụng Supabase Cloud với connection pooling
3. **Production**: 
   - Sử dụng connection pooling (port 5432)
   - Enable SSL
   - Monitor connection usage
   - Use read replicas nếu cần

4. **Migrations**:
   - Test migrations trên local trước
   - Backup database trước khi migrate production
   - Sử dụng transaction mode port cho migrations

5. **Security**:
   - Không commit `.env` file
   - Rotate database passwords định kỳ
   - Sử dụng service role key chỉ trong backend
   - Enable RLS policies

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)

