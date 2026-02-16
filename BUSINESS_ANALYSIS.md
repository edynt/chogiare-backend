# Business Analysis - Chogiare Wholesale Marketplace

## 1. Tổng quan hệ thống

Chogiare là một nền tảng thương mại điện tử kết hợp B2B (Business-to-Business) và B2C (Business-to-Consumer), tập trung vào mô hình bán sỉ (wholesale). Hệ thống cho phép:

- **Sellers (Nhà cung cấp)**: Tạo store, quản lý sản phẩm, xử lý đơn hàng, quản lý kho hàng
- **Buyers (Người mua)**: Mua sỉ/lẻ, quản lý đơn hàng, đánh giá sản phẩm
- **Admins**: Quản trị hệ thống, duyệt sản phẩm, quản lý users, báo cáo

## 2. Phân tích Business Model

### 2.1. Wholesale Features

#### Pricing Tiers (Phân cấp giá)
- **Retail Price**: Giá bán lẻ (mặc định)
- **Wholesale Price**: Giá bán sỉ (áp dụng khi mua số lượng lớn)
- **Volume Discounts**: Giảm giá theo số lượng
  - Ví dụ: Mua 10-50 sản phẩm: giảm 5%
  - Mua 51-100 sản phẩm: giảm 10%
  - Mua >100 sản phẩm: giảm 15%

#### Customer Groups (Nhóm khách hàng)
- **Retail Customers**: Khách hàng lẻ
- **Wholesale Customers**: Khách hàng sỉ (cần verify)
- **VIP Customers**: Khách hàng VIP (mua nhiều, ưu đãi đặc biệt)

#### Minimum Order Quantity (MOQ)
- Mỗi sản phẩm có thể có MOQ khác nhau
- Áp dụng giá sỉ khi đạt MOQ
- Hiển thị rõ MOQ trên product page

### 2.2. Inventory Management

#### Multi-Warehouse Support
- Sellers có thể có nhiều kho hàng
- Track inventory theo từng warehouse
- Tự động chọn warehouse gần nhất khi ship

#### Stock Tracking
- **Available Stock**: Số lượng có sẵn
- **Reserved Stock**: Số lượng đã reserve cho orders
- **Incoming Stock**: Số lượng đang nhập
- **Low Stock Alert**: Cảnh báo khi stock thấp

#### Stock Movements
- **Stock In**: Nhập kho từ supplier
- **Stock Out**: Xuất kho khi order completed
- **Stock Transfer**: Chuyển kho giữa các warehouse
- **Stock Adjustment**: Điều chỉnh stock (tồn kho thực tế)

### 2.3. Order Flow

#### Order Types
1. **Retail Order**: Đơn hàng lẻ (số lượng nhỏ)
2. **Wholesale Order**: Đơn hàng sỉ (số lượng lớn, có MOQ)
3. **Mixed Order**: Đơn hàng hỗn hợp (cả lẻ và sỉ)

#### Order Status Flow
```
pending → confirmed → ready_for_pickup → completed
         ↓
      cancelled/refunded
```

#### Stock Reservation
- Khi tạo order: Reserve stock ngay lập tức
- Khi order confirmed: Giữ reserve
- Khi order completed: Trừ stock thực tế
- Khi order cancelled: Release reserved stock

### 2.4. Payment & Pricing

#### Payment Methods
- **MoMo**: Ví điện tử MoMo
- **ZaloPay**: Ví điện tử ZaloPay
- **Stripe**: Thẻ tín dụng quốc tế
- **PayPal**: PayPal
- **Bank Transfer**: Chuyển khoản ngân hàng

#### Pricing Calculation
```
Subtotal = Sum(product_price * quantity)
Tax = Subtotal * tax_rate (nếu có)
Shipping = calculate_shipping(weight, distance)
Discount = calculate_discount(coupon, volume)
Total = Subtotal + Tax + Shipping - Discount
```

#### Wholesale Pricing Logic
```javascript
if (quantity >= MOQ) {
  price = wholesale_price
} else if (quantity >= volume_tier_1) {
  price = retail_price * (1 - discount_tier_1)
} else {
  price = retail_price
}
```

## 3. User Roles & Permissions

### 3.1. Roles

#### Buyer
- Xem sản phẩm
- Thêm vào cart
- Tạo order
- Thanh toán
- Đánh giá sản phẩm
- Chat với seller
- Quản lý địa chỉ

#### Seller
- Tất cả quyền của Buyer
- Tạo và quản lý store
- Tạo và quản lý sản phẩm
- Quản lý inventory
- Xử lý orders
- Xem báo cáo bán hàng
- Mua boost packages

#### Admin
- Tất cả quyền
- Duyệt/từ chối sản phẩm
- Quản lý users
- Quản lý categories
- Xem báo cáo tổng quan
- Quản lý system settings
- Quản lý boost packages

### 3.2. Permissions Matrix

| Feature | Buyer | Seller | Admin |
|---------|-------|--------|-------|
| View Products | ✅ | ✅ | ✅ |
| Create Product | ❌ | ✅ | ✅ |
| Approve Product | ❌ | ❌ | ✅ |
| Create Order | ✅ | ✅ | ✅ |
| Manage Orders | Own | Store | All |
| Manage Inventory | ❌ | Own | All |
| View Reports | Own | Store | All |

## 4. Key Business Rules

### 4.1. Product Rules
1. Product mới tạo có status = "draft"
2. Admin phải approve trước khi active
3. Seller có thể edit product của mình
4. Product bị suspend không hiển thị
5. Product hết stock vẫn hiển thị nhưng không thể mua

### 4.2. Order Rules
1. Order tạo từ cart hoặc trực tiếp
2. Phải reserve stock khi tạo order
3. Order có thể cancel trong 24h
4. Order completed mới cho phép review
5. Refund phải được seller/admin approve

### 4.3. Inventory Rules
1. Stock không được âm
2. Available stock = Total stock - Reserved stock
3. Low stock alert khi < min_stock
4. Stock in phải có cost price
5. Profit = Selling price - Cost price

### 4.4. Pricing Rules
1. Wholesale price chỉ áp dụng khi đạt MOQ
2. Volume discount tính theo tổng quantity
3. Coupon có thể kết hợp với volume discount
4. Shipping cost tính theo weight và distance
5. Tax tính theo subtotal (nếu có)

## 5. Revenue Model

### 5.1. Commission
- Platform thu commission từ mỗi order
- Commission rate: 5-10% (có thể config)
- Commission tính trên order total (sau discount)

### 5.2. Boost Packages
- Sellers mua boost để đẩy sản phẩm
- Các loại boost:
  - Pay Per View: Trả theo lượt xem
  - Pay Per Day: Trả theo ngày
  - Featured Slot: Vị trí nổi bật
  - Boost To Category: Đẩy lên danh mục

### 5.3. Subscription (Future)
- Sellers có thể đăng ký subscription
- Subscription benefits:
  - Giảm commission
  - Tăng số lượng products
  - Ưu tiên support
  - Analytics nâng cao

## 6. Scalability Considerations

### 6.1. Performance
- Cache products, categories, stores
- Database indexing cho search
- CDN cho images
- Redis cho session và cache
- Queue cho heavy tasks

### 6.2. Data Growth
- Archive old orders sau 1 năm
- Archive old notifications sau 3 tháng
- Partition large tables
- Optimize queries với pagination

### 6.3. Traffic
- Load balancer cho multiple instances
- Database replication
- Redis cluster
- CDN cho static assets

## 7. Integration Points

### 7.1. Payment Gateways
- MoMo API
- ZaloPay API
- Stripe API
- PayPal API
- Bank transfer (manual)

### 7.2. Shipping Providers
- Viettel Post API
- GHTK (Giao Hàng Tiết Kiệm) API

### 7.3. Storage
- Local file storage (images, files)
- CDN cho delivery (can be extended with Cloud Storage)

### 7.4. Email/SMS
- SendGrid / AWS SES (email)
- Twilio / AWS SNS (SMS)

## 8. Security Requirements

1. **Authentication**: JWT tokens với refresh mechanism
2. **Authorization**: Role-based access control (RBAC)
3. **Data Encryption**: HTTPS, encrypted sensitive data
4. **Input Validation**: Validate tất cả inputs
5. **SQL Injection**: Sử dụng Prisma ORM (parameterized queries)
6. **XSS Protection**: Sanitize outputs
7. **CSRF Protection**: CSRF tokens
8. **Rate Limiting**: Prevent abuse
9. **Audit Logging**: Log tất cả sensitive operations

## 9. Compliance & Regulations

1. **Data Privacy**: GDPR compliance (nếu có users EU)
2. **Tax**: Tính VAT theo quy định VN
3. **Payment**: PCI DSS compliance (nếu lưu card info)
4. **Business License**: Verify seller business license
5. **Product Compliance**: Verify product legality

## 10. Success Metrics

### 10.1. Business Metrics
- Total Revenue (GMV)
- Number of Orders
- Average Order Value (AOV)
- Customer Lifetime Value (CLV)
- Commission Revenue
- Boost Package Revenue

### 10.2. User Metrics
- Active Users (DAU, MAU)
- New Users
- User Retention Rate
- Seller Conversion Rate

### 10.3. Product Metrics
- Total Products
- Active Products
- Products Sold
- Average Rating
- Review Count

### 10.4. Technical Metrics
- API Response Time
- Error Rate
- Uptime
- Database Query Time
- Cache Hit Rate


