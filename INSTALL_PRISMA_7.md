# Cài đặt Prisma 7

## Quick Install

```bash
# Cài đặt Prisma 7
npm install @prisma/client@^7.0.0 prisma@^7.0.0

# Hoặc cài đặt latest
npm install @prisma/client@latest prisma@latest
```

## Verify Installation

```bash
# Check version
npx prisma --version
# Should show: prisma 7.x.x

# Check @prisma/client version
npm list @prisma/client
```

## Generate Prisma Client

Sau khi cài đặt, generate Prisma Client:

```bash
# Merge schema (nếu đã chỉnh sửa)
npm run merge:schema

# Generate Prisma Client với Prisma 7
npm run prisma:generate
```

## Schema Configuration

Prisma 7 sử dụng provider mới:

```prisma
generator client {
  provider = "prisma-client"  // ✅ Prisma 7
}
```

File `prisma/schema/base.prisma` đã được cập nhật với provider mới.

## Next Steps

1. ✅ Install Prisma 7: `npm install @prisma/client@^7.0.0 prisma@^7.0.0`
2. ✅ Generate Client: `npm run prisma:generate`
3. ✅ Run Migrations: `npm run prisma:migrate`
4. ✅ Test: `npm run test:db`

## Troubleshooting

### Lỗi: Unknown provider "prisma-client"

**Giải pháp**: Đảm bảo đã cài Prisma 7:
```bash
npm install @prisma/client@^7.0.0 prisma@^7.0.0
```

### Lỗi: Version mismatch

**Giải pháp**: Đảm bảo @prisma/client và prisma cùng version:
```bash
npm install @prisma/client@^7.0.0 prisma@^7.0.0 --save-exact
```

### Lỗi: Type errors

**Giải pháp**: Regenerate Prisma Client:
```bash
npm run prisma:generate
```

## Requirements

- Node.js 18.17.0 hoặc cao hơn
- npm hoặc yarn

