# Setup Environment Variables

## Tạo file .env

### Cách 1: Sử dụng script (Khuyến nghị)

```bash
npm run generate:env
```

Script sẽ tự động tạo file `.env` với cấu hình mặc định cho Supabase port 5433.

### Cách 2: Copy từ .env.example

```bash
cp .env.example .env
```

### Cách 3: Tạo thủ công

Tạo file `.env` trong root directory với nội dung từ `.env.example`.

## Cấu hình Database (Supabase Port 5433)

File `.env` đã được tạo với cấu hình mặc định:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/postgres?schema=public"
DATABASE_SSL="false"
```

### Nếu Supabase chạy trên port khác:

**Supabase Local mặc định (port 54322):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public"
```

**Supabase Cloud:**
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
DATABASE_SSL="true"
```

## Verify Setup

### 1. Kiểm tra file .env

```bash
# Xem nội dung file
cat .env | grep DATABASE_URL

# Hoặc
cat .env
```

### 2. Test Database Connection

```bash
npm run test:db
```

Kết quả mong đợi:
```
🔌 Testing database connection...
Database URL: postgresql://postgres:****@localhost:5433/postgres?schema=public
✅ Database connection successful!
📊 PostgreSQL version: PostgreSQL 15.x
📈 Users in database: 0
✅ All tests passed!
```

### 3. Test Health Endpoint (sau khi start app)

```bash
# Start application
npm run start:dev

# Trong terminal khác
curl http://localhost:3000/api/health
```

## Các biến môi trường quan trọng

### Bắt buộc

- `DATABASE_URL` - Connection string cho Supabase PostgreSQL
- `JWT_SECRET` - Secret key cho JWT tokens
- `REFRESH_TOKEN_SECRET` - Secret key cho refresh tokens

### Tùy chọn (có thể để trống trong development)

- `SUPABASE_URL` - Chỉ cần nếu dùng Supabase Storage/Auth
- `SUPABASE_KEY` - Chỉ cần nếu dùng Supabase Storage/Auth
- `REDIS_URL` - Chỉ cần nếu dùng Redis cache/queue
- Payment gateway keys - Chỉ cần khi implement payment
- SMTP config - Chỉ cần khi implement email

## Troubleshooting

### Lỗi: Cannot find module 'dotenv'

```bash
npm install
```

### Lỗi: DATABASE_URL is not defined

- Kiểm tra file `.env` có tồn tại không
- Kiểm tra `DATABASE_URL` có trong file không
- Đảm bảo không có khoảng trắng thừa

### Lỗi: Connection refused

- Kiểm tra Supabase/PostgreSQL có đang chạy không
- Kiểm tra port có đúng không (5433)
- Kiểm tra credentials (username/password)

### Lỗi: Database does not exist

- Tạo database trước:
```sql
CREATE DATABASE postgres;
```

Hoặc sử dụng database mặc định `postgres` của Supabase.

## Security Notes

⚠️ **QUAN TRỌNG**:

1. **KHÔNG commit file `.env`** vào git (đã có trong .gitignore)
2. **Thay đổi JWT secrets** trong production
3. **Sử dụng strong secrets** (ít nhất 32 ký tự)
4. **Rotate secrets** định kỳ
5. **Không share** `.env` file

## Production Setup

Trong production, sử dụng:

1. **Environment variables** từ hosting platform
2. **Secrets management** (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Strong secrets** (generate với: `openssl rand -base64 32`)

```bash
# Generate strong secret
openssl rand -base64 32
```

## Next Steps

Sau khi setup .env:

1. ✅ Test database connection: `npm run test:db`
2. ✅ Merge schema: `npm run merge:schema`
3. ✅ Generate Prisma Client: `npm run prisma:generate`
4. ✅ Run migrations: `npm run prisma:migrate`
5. ✅ Start application: `npm run start:dev`

