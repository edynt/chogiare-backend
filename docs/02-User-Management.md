# User Management API Documentation

## Tổng quan
Quản lý thông tin người dùng, profile, và các thông tin liên quan.

## Endpoints

### 1. Lấy danh sách users (Admin only)
**GET** `/api/users`

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `search`: string (tìm theo name, email)
- `role`: "buyer" | "seller" | "admin"
- `status`: boolean (active/inactive)
- `isVerified`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "email": "string",
        "phone": "string",
        "avatar": "string",
        "roles": ["buyer" | "seller" | "admin"],
        "postCount": 0,
        "storeInfo": { /* StoreInfo object */ },
        "isVerified": false,
        "status": true,
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

### 2. Lấy thông tin user theo ID
**GET** `/api/users/{userId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* User object */
  }
}
```

---

### 3. Cập nhật user (Admin hoặc chính user đó)
**PUT** `/api/users/{userId}`

**Request Body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "avatar": "string (optional)",
  "status": "boolean (optional, admin only)",
  "roles": ["buyer" | "seller" | "admin"] (optional, admin only)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated User object */
  }
}
```

---

### 4. Xóa user (Admin only)
**DELETE** `/api/users/{userId}`

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Logic:**
- Soft delete (set status = false) hoặc hard delete
- Nếu soft delete, cần xử lý các quan hệ (orders, products, etc.)
- Không cho phép xóa nếu user có đơn hàng đang xử lý

---

### 5. Lấy thống kê users (Admin only)
**GET** `/api/users/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 800,
    "verifiedUsers": 600,
    "buyers": 700,
    "sellers": 250,
    "admins": 50,
    "newUsersToday": 10,
    "newUsersThisWeek": 50,
    "newUsersThisMonth": 200
  }
}
```

---

### 6. Kích hoạt/Vô hiệu hóa user (Admin only)
**PATCH** `/api/users/{userId}/status`

**Request Body:**
```json
{
  "status": true | false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated User object */
  }
}
```

**Logic:**
- Khi vô hiệu hóa user, cần:
  - Ẩn tất cả products của seller
  - Hủy các đơn hàng đang pending
  - Gửi thông báo cho user

---

### 7. Xác thực email
**POST** `/api/users/{userId}/verify-email`

**Request Body:**
```json
{
  "code": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Logic:**
- Validate verification code
- Kiểm tra code chưa hết hạn
- Cập nhật is_verified = true
- Xóa verification code đã dùng

---

### 8. Gửi lại email xác thực
**POST** `/api/users/{userId}/resend-verification`

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

### 9. Lấy user balance (nếu có hệ thống ví)
**GET** `/api/users/{userId}/balance`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000000,
    "currency": "VND",
    "updatedAt": "ISO8601"
  }
}
```

---

## Database Schema

### Table: Users
Xem trong file Authentication documentation

### Table: UserInfo
```sql
- id: autoincrement (PK)
- user_id: uuid (unique, FK -> Users.id)
- full_name: text
- avatar_url: text
- gender: text
- date_of_birth: text
- phone_number: text
- address: text
- country: text
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: UserBalance (nếu có)
```sql
- id: autoincrement (PK)
- user_id: uuid (unique, FK -> Users.id)
- balance: decimal (default: 0)
- updated_at: int64 (not null)
```

## Business Logic

1. **User Roles**:
   - `buyer`: Chỉ mua hàng
   - `seller`: Có thể bán hàng và mua hàng
   - `admin`: Quản trị hệ thống

2. **User Status**:
   - `true`: Active, có thể sử dụng hệ thống
   - `false`: Inactive, bị khóa tài khoản

3. **Email Verification**:
   - Optional hoặc required tùy business logic
   - Code có thời hạn (ví dụ: 24 giờ)
   - Mỗi code chỉ dùng 1 lần

4. **Soft Delete**:
   - Không xóa hoàn toàn user
   - Chỉ set status = false
   - Giữ lại dữ liệu để audit

## Permissions

- **View own profile**: Bất kỳ user nào
- **Update own profile**: Chính user đó
- **View other users**: Public info only
- **View all users**: Admin only
- **Update other users**: Admin only
- **Delete users**: Admin only
- **Change user status**: Admin only
- **View stats**: Admin only

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: User not found
- `409`: Conflict (email đã tồn tại khi update)
- `500`: Internal Server Error

## Notes

- Implement pagination cho danh sách users
- Cache user stats để tăng performance
- Log các thay đổi quan trọng (status change, role change)
- Support search và filter
- Rate limiting cho các endpoints public

