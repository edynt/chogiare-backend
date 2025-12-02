# Schema Management Guide

## Tổng quan

Prisma schema đã được **tách thành các file nhỏ** theo domain để:
- ✅ Dễ quản lý và maintain
- ✅ Dễ mở rộng
- ✅ Tránh conflict khi làm việc nhóm
- ✅ Tổ chức code tốt hơn

## Cấu trúc Schema Files

```
prisma/schema/
├── base.prisma          # Generator và datasource config
├── enums.prisma         # Tất cả enums
├── users.prisma         # User, Session, Roles, Permissions
├── wholesale.prisma     # CustomerGroup, Warehouse
├── stores.prisma        # Store model
├── categories.prisma    # Category model
├── products.prisma      # Product, ProductImage, PricingTier, ProductWarehouse
├── inventory.prisma     # StockInRecord, StockAlerts
├── cart.prisma          # Cart, CartItem
├── addresses.prisma     # Address model
├── orders.prisma        # Order, OrderItem
├── shipping.prisma      # Shipping, ShippingHistory
├── reviews.prisma       # Review, ReviewHelpful
├── boost.prisma         # BoostPackage, ProductBoost
├── payments.prisma      # Transaction
├── chat.prisma          # Conversation, ConversationParticipant, ChatMessage
└── notifications.prisma # Notification
```

## Quy trình làm việc

### 1. Chỉnh sửa Schema

Chỉnh sửa các file trong `prisma/schema/` theo domain:

```bash
# Ví dụ: Thêm field mới vào Product
vim prisma/schema/products.prisma
```

### 2. Merge Schema Files

Sau khi chỉnh sửa, merge tất cả files thành `schema.prisma`:

```bash
npm run merge:schema
```

Hoặc chạy trực tiếp:

```bash
node scripts/merge-schema.js
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Tạo Migration

```bash
npm run prisma:migrate
```

## Thứ tự Schema Files

**Quan trọng**: Thứ tự merge phải đúng để tránh lỗi dependencies:

1. `base.prisma` - Base config
2. `enums.prisma` - Enums được dùng bởi tất cả models
3. `users.prisma` - User được reference bởi nhiều models
4. `wholesale.prisma` - Wholesale features
5. `stores.prisma` - Store
6. `categories.prisma` - Category
7. `products.prisma` - Product (depend on Category, Store, User)
8. `inventory.prisma` - Inventory (depend on Product)
9. `addresses.prisma` - Address
10. `cart.prisma` - Cart (depend on Product, User)
11. `orders.prisma` - Order (depend on User, Store, Address)
12. `shipping.prisma` - Shipping (depend on Order)
13. `reviews.prisma` - Review (depend on Product, User)
14. `boost.prisma` - Boost (depend on Product, User)
15. `payments.prisma` - Transaction (depend on User, Order, ProductBoost)
16. `chat.prisma` - Chat (depend on User)
17. `notifications.prisma` - Notification (depend on User)

## Best Practices

### 1. Tổ chức theo Domain
- Mỗi domain có 1 file riêng
- Related models ở cùng file
- Enums tách riêng để reuse

### 2. Naming Convention
- File name: `[domain].prisma` (lowercase, kebab-case)
- Model name: PascalCase
- Field name: camelCase
- Table name: snake_case (dùng `@@map`)

### 3. Dependencies
- Luôn check dependencies trước khi thêm relation
- Models phụ thuộc phải được định nghĩa trước
- Sử dụng forward references nếu cần

### 4. Indexes
- Thêm indexes cho foreign keys
- Thêm indexes cho fields thường query
- Composite indexes cho queries phức tạp

### 5. Validation
- Sử dụng constraints (unique, check)
- Validate data types
- Set default values hợp lý

## Ví dụ: Thêm Model mới

### Bước 1: Tạo file schema mới

```prisma
// prisma/schema/coupons.prisma

model Coupon {
  id          String   @id @default(uuid())
  code        String   @unique
  discount    Decimal  @db.Decimal(5, 2)
  minOrderValue Decimal? @map("min_order_value") @db.Decimal(15, 2)
  maxDiscount Decimal? @map("max_discount") @db.Decimal(15, 2)
  startDate   BigInt   @map("start_date")
  endDate     BigInt   @map("end_date")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   BigInt   @map("created_at")
  updatedAt   BigInt   @map("updated_at")

  orders      Order[]

  @@index([code])
  @@index([isActive])
  @@map("coupons")
}
```

### Bước 2: Thêm vào merge script

```javascript
// scripts/merge-schema.js
const schemaFiles = [
  // ... existing files
  'coupons.prisma', // Thêm vào đúng vị trí (sau orders.prisma)
];
```

### Bước 3: Merge và migrate

```bash
npm run merge:schema
npm run prisma:generate
npm run prisma:migrate
```

## Troubleshooting

### Lỗi: Model not found
- Check thứ tự merge trong `merge-schema.js`
- Đảm bảo model được định nghĩa trước khi được reference

### Lỗi: Duplicate enum
- Check `enums.prisma` xem enum đã tồn tại chưa
- Không định nghĩa enum trong file model, chỉ trong `enums.prisma`

### Lỗi: Relation error
- Check foreign key constraints
- Đảm bảo relation fields đúng type
- Check `onDelete` và `onUpdate` behavior

## Migration Strategy

### Development
```bash
# Tạo migration mới
npm run prisma:migrate

# Reset database (chỉ dev)
npx prisma migrate reset
```

### Production
```bash
# Deploy migrations
npm run prisma:migrate:deploy
```

## Tips

1. **Review trước khi merge**: Check tất cả changes trước khi merge
2. **Test migrations**: Test migrations trên dev trước khi deploy production
3. **Backup**: Backup database trước khi chạy migrations quan trọng
4. **Documentation**: Comment các models phức tạp
5. **Version control**: Commit schema files riêng biệt để dễ review

