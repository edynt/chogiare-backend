# Boost & Promotion System API Documentation

## Tổng quan
Hệ thống boost/promotion để sellers có thể đẩy sản phẩm lên top, hiển thị nổi bật.

## Boost Packages

### Các loại boost packages:

1. **Pay Per View (PPV)**: Trả phí theo số lượt xem thực tế
2. **Pay Per Day (PPD)**: Trả phí theo số ngày boost
3. **Featured Slot**: Hiển thị ở banner và top danh sách
4. **Boost To Category**: Đẩy sản phẩm lên đầu danh mục

## Endpoints

### 1. Lấy danh sách boost packages
**GET** `/api/boost/packages`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ppv_1k",
      "name": "1,000 lượt xem",
      "type": "payPerView",
      "price": 50000,
      "description": "Trả phí theo số lượt xem thực tế",
      "config": {
        "views": 1000,
        "pricePer1000Views": 50000
      },
      "isActive": true,
      "createdAt": "ISO8601"
    },
    {
      "id": "ppd_7",
      "name": "7 ngày",
      "type": "payPerDay",
      "price": 250000,
      "description": "Đẩy bài trong 7 ngày",
      "config": {
        "days": 7
      },
      "isActive": true,
      "createdAt": "ISO8601"
    },
    {
      "id": "featured_7",
      "name": "Vị trí nổi bật - 7 ngày",
      "type": "featuredSlot",
      "price": 600000,
      "description": "Hiển thị ở banner và top danh sách",
      "config": {
        "days": 7,
        "showInBanner": true,
        "showInTopList": true
      },
      "isActive": true,
      "createdAt": "ISO8601"
    },
    {
      "id": "category_7",
      "name": "Đẩy lên danh mục - 7 ngày",
      "type": "boostToCategory",
      "price": 180000,
      "description": "Đẩy sản phẩm lên đầu danh mục",
      "config": {
        "days": 7
      },
      "isActive": true,
      "createdAt": "ISO8601"
    }
  ]
}
```

---

### 2. Lấy boost package theo ID
**GET** `/api/boost/packages/{packageId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* BoostPackage object */
  }
}
```

---

### 3. Mua boost cho sản phẩm
**POST** `/api/boost/purchase`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "uuid (required)",
  "packageId": "string (required)",
  "paymentMethod": "momo" | "zalopay" | "stripe" | "paypal" | "bank_transfer"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "boostPackageId": "string",
    "userId": 123,
    "status": "active",
    "viewsTarget": 1000,
    "viewsActual": 0,
    "days": 7,
    "startDate": "ISO8601",
    "endDate": "ISO8601",
    "totalCost": 250000,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Validate product thuộc về seller
- Validate package tồn tại và active
- Tính totalCost dựa trên package
- Tạo payment transaction
- Nếu payment thành công:
  - Tạo ProductBoost record
  - Set product.isPromoted = true
  - Set startDate và endDate
  - Apply boost effects

---

### 4. Lấy danh sách boosts của user
**GET** `/api/boost/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 20)
- `status`: "active" | "expired" | "cancelled"
- `productId`: uuid

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "productImage": "string",
        "boostPackageId": "string",
        "packageName": "string",
        "status": "active",
        "viewsTarget": 1000,
        "viewsActual": 500,
        "days": 7,
        "startDate": "ISO8601",
        "endDate": "ISO8601",
        "totalCost": 250000,
        "createdAt": "ISO8601"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

### 5. Lấy thông tin boost
**GET** `/api/boost/{boostId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* ProductBoost object với đầy đủ thông tin */
  }
}
```

---

### 6. Hủy boost
**POST** `/api/boost/{boostId}/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated ProductBoost với status = "cancelled" */
  }
}
```

**Logic:**
- Chỉ owner hoặc admin mới được cancel
- Set status = "cancelled"
- Remove boost effects
- Set product.isPromoted = false
- Không refund (hoặc refund tùy policy)

---

### 7. Lấy thống kê boost
**GET** `/api/boost/stats`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBoosts": 50,
    "activeBoosts": 10,
    "expiredBoosts": 35,
    "cancelledBoosts": 5,
    "totalSpent": 5000000,
    "totalViews": 50000,
    "averageViewsPerBoost": 1000
  }
}
```

---

### 8. Update boost views (Internal/Webhook)
**POST** `/api/boost/{boostId}/views`

**Request Body:**
```json
{
  "views": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Views updated"
}
```

**Logic:**
- Increment viewsActual
- Nếu viewsActual >= viewsTarget (PPV), có thể expire boost
- Track view để tính phí (nếu PPV)

---

### 9. Lấy products đang được boost
**GET** `/api/boost/active`

**Query Parameters:**
- `type`: "payPerView" | "payPerDay" | "featuredSlot" | "boostToCategory"
- `categoryId`: uuid
- `limit`: number (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "product": {
        /* Product object */
      },
      "boost": {
        /* ProductBoost object */
      }
    }
  ]
}
```

---

## Database Schema

### Table: BoostPackages
```sql
- id: text (PK)
- name: text (not null)
- type: boost_type (not null)
- price: decimal (not null)
- description: text
- config_views: int
- config_days: int
- config_show_in_banner: boolean
- config_show_in_top_list: boolean
- config_price_per_1000_views: decimal
- is_active: boolean (default: true)
- created_at: int64 (not null)
```

### Table: ProductBoosts
```sql
- id: uuid (PK)
- product_id: uuid (FK -> Products.id, not null)
- boost_package_id: text (FK -> BoostPackages.id, not null)
- user_id: uuid (FK -> Users.id, not null)
- status: boost_status (default: 'active')
- views_target: int
- views_actual: int (default: 0)
- days: int
- start_date: int64 (not null)
- end_date: int64
- total_cost: decimal (not null)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

## Enums

### BoostType
- `payPerView`: Trả phí theo lượt xem
- `payPerDay`: Trả phí theo ngày
- `featuredSlot`: Vị trí nổi bật
- `boostToCategory`: Đẩy lên danh mục

### BoostStatus
- `active`: Đang active
- `expired`: Đã hết hạn
- `cancelled`: Đã hủy

## Business Logic

1. **Boost Types**:

   **Pay Per View (PPV)**:
   - Trả phí theo số lượt xem thực tế
   - Track viewsActual mỗi khi có người xem product
   - Khi viewsActual >= viewsTarget, boost có thể expire
   - Charge theo views thực tế

   **Pay Per Day (PPD)**:
   - Trả phí cố định cho số ngày
   - Set endDate = startDate + days
   - Auto-expire khi endDate < now
   - Product hiển thị ưu tiên trong thời gian boost

   **Featured Slot**:
   - Hiển thị ở banner và top danh sách
   - Trả phí theo ngày
   - Set product.isFeatured = true
   - Set product.isPromoted = true

   **Boost To Category**:
   - Đẩy sản phẩm lên đầu danh mục
   - Sort products có boost trước
   - Trả phí theo ngày

2. **Boost Effects**:
   - Set product.isPromoted = true
   - Set product.isFeatured = true (nếu featuredSlot)
   - Sort priority trong search results
   - Hiển thị badge "PROMOTED" hoặc "FEATURED"

3. **Boost Expiration**:
   - Auto-check và expire boosts hết hạn
   - Cron job chạy định kỳ (ví dụ: mỗi giờ)
   - Remove boost effects khi expire
   - Set product.isPromoted = false

4. **View Tracking**:
   - Track mỗi khi có người xem product detail
   - Increment viewsActual
   - Chỉ track unique views (mỗi user 1 lần)
   - Hoặc track tất cả views (tùy business logic)

5. **Payment**:
   - Tạo transaction khi purchase boost
   - Payment qua các methods: MoMo, ZaloPay, Stripe, PayPal, Bank Transfer
   - Chỉ activate boost khi payment thành công

6. **Boost Priority**:
   - FeaturedSlot > BoostToCategory > PayPerDay > PayPerView
   - Nếu có nhiều boosts, ưu tiên boost có priority cao nhất
   - Sort products: promoted > featured > normal

## Permissions

- **View packages**: Public
- **Purchase boost**: Seller (own products)
- **View own boosts**: Seller
- **Cancel own boost**: Seller
- **Cancel any boost**: Admin
- **View active boosts**: Public
- **Manage packages**: Admin only

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Boost/Package not found
- `409`: Conflict (product đã có boost active)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Implement cron job để auto-expire boosts
- Track views để tính phí PPV
- Support multiple boosts cho 1 product (ưu tiên theo type)
- Cache active boosts để tăng performance
- Support boost scheduling (mua trước, activate sau)
- Analytics cho boost effectiveness
- Support boost bundles (mua nhiều packages giảm giá)
- Refund policy cho cancelled boosts
- Limit số boosts active cùng lúc (nếu cần)
- Support boost targeting (theo category, location)

