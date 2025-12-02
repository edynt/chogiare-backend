# Admin Features API Documentation

## Tổng quan
Các tính năng quản trị hệ thống dành cho admin, bao gồm quản lý users, products, orders, reports, settings.

## Admin Endpoints

### 1. Dashboard Overview
**GET** `/api/admin/dashboard`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 10000,
      "activeUsers": 8000,
      "totalProducts": 50000,
      "activeProducts": 40000,
      "totalOrders": 20000,
      "pendingOrders": 500,
      "completedOrders": 15000,
      "totalRevenue": 1000000000,
      "todayRevenue": 5000000,
      "todayOrders": 100
    },
    "recentActivity": [
      {
        "type": "order",
        "message": "New order #12345",
        "timestamp": "ISO8601"
      }
    ],
    "pendingReviews": 10,
    "pendingProducts": 5,
    "supportTickets": 3
  }
}
```

---

### 2. User Management

#### 2.1. Lấy danh sách users
**GET** `/api/admin/users`

**Query Parameters:**
- `page`: number
- `pageSize`: number
- `search`: string
- `role`: "buyer" | "seller" | "admin"
- `status`: boolean
- `isVerified`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    /* UserListResponse */
  }
}
```

#### 2.2. Cập nhật user
**PUT** `/api/admin/users/{userId}`

**Request Body:**
```json
{
  "status": true,
  "roles": ["buyer", "seller"],
  "isVerified": true
}
```

#### 2.3. Xóa user
**DELETE** `/api/admin/users/{userId}`

#### 2.4. Kích hoạt/Vô hiệu hóa user
**PATCH** `/api/admin/users/{userId}/status`

---

### 3. Product Moderation

#### 3.1. Lấy products chờ duyệt
**GET** `/api/admin/products/pending`

**Query Parameters:**
- `page`: number
- `pageSize`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "sellerId": "uuid",
        "sellerName": "string",
        "status": "draft",
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

#### 3.2. Duyệt product
**POST** `/api/admin/products/{productId}/approve`

**Request Body:**
```json
{
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Product với status = "active" */
  }
}
```

#### 3.3. Từ chối product
**POST** `/api/admin/products/{productId}/reject`

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Product với status = "suspended" */
  }
}
```

#### 3.4. Suspend product
**POST** `/api/admin/products/{productId}/suspend`

**Request Body:**
```json
{
  "reason": "string (required)"
}
```

#### 3.5. Lấy products vi phạm
**GET** `/api/admin/products/violations`

**Query Parameters:**
- `page`: number
- `pageSize`: number
- `severity`: "low" | "medium" | "high"

---

### 4. Order Management

#### 4.1. Lấy tất cả orders
**GET** `/api/admin/orders`

**Query Parameters:**
- `page`: number
- `pageSize`: number
- `status`: string
- `paymentStatus`: string
- `storeId`: uuid
- `userId`: uuid
- `startDate`: ISO8601
- `endDate`: ISO8601

**Response:**
```json
{
  "success": true,
  "data": {
    /* OrderListResponse */
  }
}
```

#### 4.2. Cập nhật order (Admin override)
**PUT** `/api/admin/orders/{orderId}`

**Request Body:**
```json
{
  "status": "string",
  "paymentStatus": "string",
  "notes": "string"
}
```

#### 4.3. Cancel order
**POST** `/api/admin/orders/{orderId}/cancel`

**Request Body:**
```json
{
  "reason": "string"
}
```

---

### 5. Package/Subscription Management

#### 5.1. Lấy danh sách boost packages
**GET** `/api/admin/packages`

**Response:**
```json
{
  "success": true,
  "data": [
    /* Array of BoostPackage objects */
  ]
}
```

#### 5.2. Tạo boost package
**POST** `/api/admin/packages`

**Request Body:**
```json
{
  "id": "string",
  "name": "string",
  "type": "payPerView" | "payPerDay" | "featuredSlot" | "boostToCategory",
  "price": 100000,
  "description": "string",
  "config": {
    "views": 1000,
    "days": 7,
    "showInBanner": true,
    "showInTopList": true,
    "pricePer1000Views": 50000
  },
  "isActive": true
}
```

#### 5.3. Cập nhật boost package
**PUT** `/api/admin/packages/{packageId}`

#### 5.4. Xóa boost package
**DELETE** `/api/admin/packages/{packageId}`

---

### 6. Reports & Analytics

#### 6.1. Lấy báo cáo tổng quan
**GET** `/api/admin/reports/overview`

**Query Parameters:**
- `startDate`: ISO8601
- `endDate`: ISO8601

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 1000000000,
      "byDay": [
        {
          "date": "2024-01-01",
          "revenue": 5000000
        }
      ],
      "byMonth": [
        {
          "month": "2024-01",
          "revenue": 150000000
        }
      ]
    },
    "orders": {
      "total": 20000,
      "byStatus": {
        "pending": 500,
        "confirmed": 1000,
        "completed": 15000,
        "cancelled": 500
      }
    },
    "users": {
      "total": 10000,
      "newUsers": 100,
      "activeUsers": 8000
    },
    "products": {
      "total": 50000,
      "active": 40000,
      "sold": 10000
    }
  }
}
```

#### 6.2. Lấy báo cáo doanh thu
**GET** `/api/admin/reports/revenue`

**Query Parameters:**
- `startDate`: ISO8601
- `endDate`: ISO8601
- `groupBy`: "day" | "week" | "month" | "year"
- `storeId`: uuid

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 1000000000,
      "totalOrders": 20000,
      "averageOrderValue": 50000,
      "growthRate": 10.5
    },
    "data": [
      {
        "period": "2024-01",
        "revenue": 150000000,
        "orders": 3000
      }
    ]
  }
}
```

#### 6.3. Lấy báo cáo sản phẩm
**GET** `/api/admin/reports/products`

**Query Parameters:**
- `startDate`: ISO8601
- `endDate`: ISO8601
- `categoryId`: uuid

**Response:**
```json
{
  "success": true,
  "data": {
    "topSelling": [
      {
        "productId": "uuid",
        "productName": "string",
        "salesCount": 1000,
        "revenue": 100000000
      }
    ],
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "string",
        "productCount": 1000,
        "salesCount": 5000,
        "revenue": 500000000
      }
    ]
  }
}
```

#### 6.4. Export report
**GET** `/api/admin/reports/export`

**Query Parameters:**
- `type`: "overview" | "revenue" | "products" | "users"
- `format`: "csv" | "excel"
- `startDate`: ISO8601
- `endDate`: ISO8601

**Response:**
- File download

---

### 7. Content Management

#### 7.1. Lấy danh sách categories
**GET** `/api/admin/categories`

#### 7.2. Tạo category
**POST** `/api/admin/categories`

#### 7.3. Cập nhật category
**PUT** `/api/admin/categories/{categoryId}`

#### 7.4. Xóa category
**DELETE** `/api/admin/categories/{categoryId}`

---

### 8. Customer Support

#### 8.1. Lấy danh sách support tickets
**GET** `/api/admin/support/tickets`

**Query Parameters:**
- `page`: number
- `pageSize`: number
- `status`: "open" | "in_progress" | "resolved" | "closed"
- `priority`: "low" | "medium" | "high"

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "uuid",
        "userId": 123,
        "userName": "string",
        "subject": "string",
        "message": "string",
        "status": "open",
        "priority": "high",
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

#### 8.2. Xử lý support ticket
**POST** `/api/admin/support/tickets/{ticketId}/resolve`

**Request Body:**
```json
{
  "response": "string",
  "status": "resolved"
}
```

---

### 9. Notification Management

#### 9.1. Gửi notification cho tất cả users
**POST** `/api/admin/notifications/broadcast`

**Request Body:**
```json
{
  "type": "order" | "product" | "payment" | "system" | "promotion",
  "title": "string",
  "message": "string",
  "actionUrl": "string (optional)"
}
```

#### 9.2. Gửi notification cho user cụ thể
**POST** `/api/admin/notifications/send`

**Request Body:**
```json
{
  "userId": "uuid",
  "type": "string",
  "title": "string",
  "message": "string",
  "actionUrl": "string"
}
```

---

### 10. System Settings

#### 10.1. Lấy system settings
**GET** `/api/admin/settings`

**Response:**
```json
{
  "success": true,
  "data": {
    "siteName": "Chogiare",
    "siteDescription": "string",
    "maintenanceMode": false,
    "registrationEnabled": true,
    "emailVerificationRequired": true,
    "maxProductsPerSeller": 1000,
    "commissionRate": 5.0,
    "taxRate": 10.0,
    "currency": "VND",
    "paymentMethods": ["momo", "zalopay", "bank_transfer"],
    "shippingEnabled": false
  }
}
```

#### 10.2. Cập nhật system settings
**PUT** `/api/admin/settings`

**Request Body:**
```json
{
  "siteName": "string",
  "siteDescription": "string",
  "maintenanceMode": false,
  "registrationEnabled": true,
  "emailVerificationRequired": true,
  "maxProductsPerSeller": 1000,
  "commissionRate": 5.0,
  "taxRate": 10.0
}
```

---

## Permissions

Tất cả endpoints trong `/api/admin/*` yêu cầu:
- User phải có role = "admin"
- Valid access token

## Business Logic

1. **Product Moderation**:
   - Products mới tạo có status = "draft"
   - Admin approve → status = "active"
   - Admin reject → status = "suspended" + reason
   - Auto-approve nếu seller đã verified

2. **User Management**:
   - Admin có thể kích hoạt/vô hiệu hóa user
   - Admin có thể thay đổi roles
   - Admin có thể xóa user (soft delete)

3. **Reports**:
   - Tính toán real-time hoặc cache
   - Support export CSV/Excel
   - Support filtering và grouping

4. **System Settings**:
   - Lưu trong database hoặc config file
   - Cache settings để tăng performance
   - Validate settings trước khi save

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (không phải admin)
- `404`: Resource not found
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Tất cả admin endpoints cần authentication và authorization
- Log tất cả admin actions để audit
- Support admin activity history
- Rate limiting cho admin endpoints
- Support admin roles và permissions (nếu có nhiều level admin)
- Cache dashboard stats để tăng performance
- Support real-time updates cho dashboard
- Export reports với large datasets
- Support bulk operations (approve/reject nhiều products)

