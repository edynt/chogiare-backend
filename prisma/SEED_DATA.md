# Seed Data Documentation

## Tổng quan

File seed (`prisma/seed.ts`) tạo dữ liệu mẫu đầy đủ cho toàn bộ hệ thống Chogiare để test và phát triển.

## Dữ liệu được tạo

### 1. Roles & Permissions
- **Roles**: `admin`, `seller`, `buyer`
- **Permissions**: 10 permissions (users.read/write/delete, products.read/write/delete, orders.read/write, stores.read/write)
- **Role-Permission mappings**: 
  - Admin: Tất cả permissions
  - Seller: products.read/write, orders.read, stores.read/write
  - Buyer: products.read, orders.read/write

### 2. Users
- **1 Admin**: `admin@chogiare.com` / `password123`
- **5 Sellers**: `seller1@chogiare.com` đến `seller5@chogiare.com` / `password123`
  - 3 sellers đầu được verified
- **10 Buyers**: `buyer1@chogiare.com` đến `buyer10@chogiare.com` / `password123`
- Tất cả users đều có `userInfo` với đầy đủ thông tin

### 3. Categories
- **5 Categories**:
  - Điện Tử (parent)
    - Điện Thoại (child)
    - Laptop (child)
  - Thời Trang
  - Thực Phẩm

### 4. Stores
- **5 Stores** (1 store per seller)
- Mỗi store có:
  - Contact info (phone, email, website, social media)
  - Address info (full address với lat/lng)
  - Business info (type, tax code, established year)
  - Business hours (7 ngày)
  - Policies (return, shipping)
  - 3 stores đầu được verified

### 5. Products
- **50 Products** được phân bổ cho các sellers
- Mỗi product có:
  - 1-5 images
  - Full inventory info (weight, dimensions, supplier)
  - Pricing (price, originalPrice, costPrice, profit, profitMargin)
  - Stock management (stock, reservedStock, availableStock)
  - Status: draft, active, sold
  - 5 products đầu được featured
  - 3 products đầu được promoted
  - Tags và badges
- Product count được update tự động trong stores và categories

### 6. Addresses
- Mỗi buyer có 1-3 addresses
- 1 address được set làm default
- Address metadata (landmark, notes)

### 7. Carts
- Mỗi buyer có 1 cart
- Mỗi cart có 1-5 items
- Price snapshot tại thời điểm thêm vào cart

### 8. Orders
- **30 Orders** với các status khác nhau:
  - pending, confirmed, ready_for_pickup, completed, cancelled
- Payment status: pending, completed, failed
- Payment methods: momo, zalopay, bank_transfer, stripe
- Mỗi order có 1-3 items
- Order metadata (source, IP)

### 9. Reviews
- Reviews cho các orders đã completed
- Rating 3-5 sao
- Một số reviews có images
- Verified reviews (có orderId)
- Product rating và reviewCount được update tự động

### 10. Conversations
- **15 Conversations** (direct chat)
- Mỗi conversation có 2 participants (seller + buyer)
- Mỗi conversation có 3-12 messages
- Message read status tracking

### 11. Transactions
- Transactions cho các orders đã completed
- 10 deposit transactions
- Transaction metadata (gateway, transactionId)

### 12. Shipping
- Shipping cho các orders confirmed/completed
- Tracking numbers
- Multiple carriers (Viettel Post, GHN, GHTK, J&T Express)
- Shipping history (2-5 status updates)

### 13. Boost Packages
- **4 Boost Packages**:
  - `ppv_1k`: Pay Per View - 1,000 views
  - `ppd_7`: Pay Per Day - 7 days
  - `featured_7`: Featured Slot - 7 days
  - `category_7`: Boost To Category - 7 days

### 14. Product Boosts
- Boosts cho 5 promoted products
- Active boosts với startDate và endDate
- Views tracking cho PPV

### 15. Stock Records
- Stock in records cho tất cả products
- 1-3 records per product
- Supplier info và notes

### 16. Notifications
- 5-15 notifications per user
- Multiple types: order, product, payment, system, promotion
- Read/unread status
- Action URLs

### 17. User Balances
- Balances cho tất cả sellers
- Random amounts (1M - 10M VND)

## Cách sử dụng

### Chạy seed
```bash
npm run prisma:seed
# hoặc
npm run seed
```

### Reset và seed lại
```bash
# Xóa tất cả dữ liệu và seed lại
npx prisma migrate reset
npm run prisma:seed
```

### Xem dữ liệu
```bash
# Mở Prisma Studio
npm run prisma:studio
```

## Credentials

### Admin
- Email: `admin@chogiare.com`
- Password: `password123`
- Username: `admin`

### Sellers
- Email: `seller1@chogiare.com` đến `seller5@chogiare.com`
- Password: `password123`
- Username: `seller1` đến `seller5`

### Buyers
- Email: `buyer1@chogiare.com` đến `buyer10@chogiare.com`
- Password: `password123`
- Username: `buyer1` đến `buyer10`

## Lưu ý

1. **Timestamps**: Tất cả timestamps được tạo với:
   - `now`: Hiện tại
   - `oneDayAgo`: 1 ngày trước
   - `oneWeekAgo`: 1 tuần trước
   - `oneMonthAgo`: 1 tháng trước

2. **Relations**: Tất cả relations được tạo đúng:
   - Products → Stores → Users
   - Orders → Users, Stores, Addresses
   - Reviews → Products, Users, Orders
   - etc.

3. **Auto-updates**: Một số fields được update tự động:
   - `productCount` trong stores và categories
   - `rating` và `reviewCount` trong products
   - `availableStock` = `stock` - `reservedStock`

4. **JSON Fields**: Tất cả JSON fields được populate với dữ liệu realistic

5. **Data Consistency**: Dữ liệu được tạo đảm bảo consistency:
   - Orders chỉ có products từ cùng store
   - Reviews chỉ cho orders đã completed
   - Shipping chỉ cho orders confirmed/completed

## Testing

Seed data được thiết kế để test:
- ✅ Authentication & Authorization
- ✅ Product listing và search
- ✅ Cart management
- ✅ Order creation và management
- ✅ Payment processing
- ✅ Shipping tracking
- ✅ Reviews và ratings
- ✅ Chat system
- ✅ Boost và promotion
- ✅ Inventory management
- ✅ Notifications

## Customization

Để customize seed data, chỉnh sửa file `prisma/seed.ts`:
- Thay đổi số lượng records
- Thay đổi dữ liệu mẫu
- Thêm/bớt relations
- Customize JSON fields

