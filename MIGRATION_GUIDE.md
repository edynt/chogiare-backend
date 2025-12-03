# Migration & Seeding Guide

## Tổng quan

Dự án đã được cập nhật với:
- ✅ Prisma schema với max length cho tất cả string fields
- ✅ Category module (đầy đủ CRUD với validation)
- ✅ Address module (đầy đủ CRUD với validation)
- ✅ Auth module (đã cập nhật với MaxLength validation)
- ✅ Seeder với dữ liệu mẫu

## Các bước thực hiện

### 1. Tạo Migration

Chạy lệnh sau để tạo migration từ schema đã cập nhật:

```bash
npm run prisma:migrate
```

Hoặc nếu muốn đặt tên migration:

```bash
npx prisma migrate dev --name add_max_length_constraints
```

### 2. Chạy Seeder

Sau khi migration thành công, chạy seeder để tạo dữ liệu mẫu:

```bash
npm run prisma:seed
```

Hoặc:

```bash
npx prisma db seed
```

### 3. Kiểm tra dữ liệu

Sử dụng Prisma Studio để xem dữ liệu:

```bash
npm run prisma:studio
```

## Dữ liệu mẫu được tạo

Seeder sẽ tạo:

1. **Roles**: buyer, seller, admin
2. **Users**:
   - Admin: `admin@chogiare.com` / `admin123`
   - Seller: `seller@chogiare.com` / `seller123`
   - Buyer: `buyer@chogiare.com` / `buyer123`
3. **User Info**: Thông tin cho các users
4. **Categories**: 
   - Điện Tử (với subcategories: Điện Thoại, Laptop)
   - Thời Trang
   - Thực Phẩm
5. **Store**: Cửa hàng mẫu cho seller
6. **Boost Packages**: Các gói boost mẫu
7. **User Balances**: Số dư cho seller và buyer

## Các module đã hoàn thành

### 1. Auth Module
- ✅ Register với MaxLength validation
- ✅ Login với MaxLength validation
- ✅ Refresh token với MaxLength validation
- ✅ JWT authentication

### 2. Category Module
- ✅ CRUD operations
- ✅ MaxLength validation cho tất cả fields
- ✅ Slug validation (chỉ chữ thường, số, dấu gạch ngang)
- ✅ Parent-child relationship
- ✅ Public endpoints cho listing và detail

### 3. Address Module
- ✅ CRUD operations
- ✅ MaxLength validation cho tất cả fields
- ✅ Phone number validation
- ✅ Set default address
- ✅ User-specific access control

## Các module cần phát triển tiếp

1. **Store Module**: Quản lý cửa hàng
2. **Product Module**: Quản lý sản phẩm với inventory
3. **Cart Module**: Giỏ hàng
4. **Order Module**: Đơn hàng
5. **Review Module**: Đánh giá sản phẩm
6. **Notification Module**: Thông báo

## Best Practices đã áp dụng

1. **MaxLength cho tất cả string fields**: 
   - Email: 255
   - Username: 50
   - Name/Title: 255
   - Description: Text (không giới hạn) hoặc VarChar(2000)
   - Phone: 20
   - URL: 500
   - Slug: 255

2. **Clean Architecture**:
   - Domain layer: Entities, Repository Interfaces
   - Application layer: DTOs, Services, Use Cases
   - Infrastructure layer: Repositories (Prisma)
   - Interfaces layer: Controllers

3. **Validation**:
   - Sử dụng class-validator với MaxLength
   - Custom validation messages (tiếng Việt)
   - Pattern matching cho slug, phone

4. **Error Handling**:
   - NotFoundException cho resource không tồn tại
   - ConflictException cho duplicate
   - ForbiddenException cho unauthorized access

## Lưu ý

- Tất cả timestamps sử dụng `BigInt` (Unix timestamp milliseconds)
- UUID được sử dụng cho tất cả IDs
- Decimal được sử dụng cho tiền tệ và giá cả
- Indexes đã được thêm vào các fields thường query

## Tiếp tục phát triển

Khi tạo module mới, hãy tuân theo pattern đã có:
1. Tạo domain entities và repository interfaces
2. Tạo DTOs với MaxLength validation
3. Tạo service với business logic
4. Tạo repository implementation với Prisma
5. Tạo controller với proper guards
6. Export module và import vào AppModule

