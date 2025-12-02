# Authentication & Authorization API Documentation

## Tổng quan
Hệ thống xác thực và phân quyền cho Chogiare Admin Seller Platform. Hỗ trợ đăng nhập, đăng ký, quản lý token, OAuth và quản lý phiên làm việc.

## Endpoints

### 1. Đăng nhập (Login)
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "avatar": "string",
      "roles": ["buyer" | "seller" | "admin"],
      "postCount": 0,
      "storeInfo": {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "logo": "string",
        "banner": "string",
        "address": "string",
        "phone": "string",
        "email": "string",
        "isVerified": false,
        "rating": 0,
        "reviewCount": 0,
        "createdAt": "ISO8601"
      },
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string",
      "expiresIn": 3600
    }
  }
}
```

**Logic:**
- Xác thực email và password
- Tạo access token và refresh token
- Lưu session vào database
- Trả về thông tin user và tokens

---

### 2. Đăng ký (Register)
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string (optional)",
  "roles": ["buyer" | "seller" | "admin"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": { /* Tokens object */ }
  }
}
```

**Logic:**
- Validate email format và password strength
- Hash password trước khi lưu
- Tạo user mới với role mặc định là "buyer"
- Tạo tokens và session
- Gửi email xác thực (nếu cần)

---

### 3. Đăng xuất (Logout)
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Logic:**
- Xóa refresh token khỏi database
- Invalidate session
- Clear tokens ở client

---

### 4. Refresh Token
**POST** `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600
  }
}
```

**Logic:**
- Validate refresh token
- Kiểm tra token chưa hết hạn
- Tạo access token mới
- Có thể tạo refresh token mới (rotation)
- Trả về tokens mới

---

### 5. Quên mật khẩu (Forgot Password)
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Logic:**
- Tìm user theo email
- Tạo reset token với thời hạn (ví dụ: 1 giờ)
- Lưu vào bảng PasswordResets
- Gửi email chứa link reset password
- Link format: `/reset-password?token={resetToken}`

---

### 6. Đặt lại mật khẩu (Reset Password)
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "token": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Logic:**
- Validate reset token
- Kiểm tra token chưa hết hạn
- Hash password mới
- Cập nhật password cho user
- Xóa reset token đã sử dụng
- Invalidate tất cả sessions của user (bảo mật)

---

### 7. Lấy thông tin profile
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* User object với đầy đủ thông tin */
  }
}
```

---

### 8. Cập nhật profile
**PATCH** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "phone": "string (optional)",
  "avatar": "string (optional)"
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

### 9. Đổi mật khẩu
**POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Logic:**
- Verify current password
- Validate new password strength
- Hash và cập nhật password mới
- Invalidate các sessions khác (optional, tùy yêu cầu bảo mật)

---

### 10. OAuth - Google
**POST** `/api/auth/google`

**Request Body:**
```json
{
  "token": "string (Google OAuth token)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": { /* Tokens object */ }
  }
}
```

**Logic:**
- Verify Google OAuth token
- Lấy thông tin user từ Google
- Tìm hoặc tạo user trong hệ thống
- Tạo tokens và session
- Trả về user và tokens

---

### 11. OAuth - Facebook
**POST** `/api/auth/facebook`

**Request Body:**
```json
{
  "token": "string (Facebook OAuth token)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "tokens": { /* Tokens object */ }
  }
}
```

**Logic:**
- Tương tự Google OAuth
- Verify Facebook token
- Lấy thông tin user từ Facebook
- Tìm hoặc tạo user
- Tạo tokens và session

---

## Database Schema

### Table: Users
```sql
- id: uuid (PK)
- email: text (unique, not null)
- username: text (unique)
- hashed_password: text (not null)
- is_verified: boolean (default: false)
- status: boolean (default: true)
- language: text (default: 'vi')
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: Sessions
```sql
- id: autoincrement (PK)
- user_id: uuid (FK -> Users.id)
- refresh_token: text (not null)
- expires_at: int64 (not null)
- created_at: int64 (not null)
```

### Table: EmailVerifications
```sql
- id: autoincrement (PK)
- user_id: uuid (FK -> Users.id)
- code: text (not null)
- expires_at: int64 (not null)
- created_at: int64 (not null)
```

### Table: PasswordResets
```sql
- id: autoincrement (PK)
- user_id: uuid (FK -> Users.id)
- reset_token: text (not null)
- expires_at: int64 (not null)
- created_at: int64 (not null)
```

### Table: Roles
```sql
- id: autoincrement (PK)
- name: text (unique, not null)
- description: text
- created_at: int64 (not null)
```

### Table: Permissions
```sql
- id: autoincrement (PK)
- name: text (unique, not null)
- description: text
- created_at: int64 (not null)
```

### Table: RolePermissions
```sql
- role_id: int (PK, FK -> Roles.id)
- permission_id: int (PK, FK -> Permissions.id)
```

### Table: UserRoles
```sql
- user_id: uuid (PK, FK -> Users.id)
- role_id: int (PK, FK -> Roles.id)
```

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

## Security Requirements

1. **Password Hashing**: Sử dụng bcrypt hoặc argon2 với salt rounds >= 10
2. **Token Expiration**:
   - Access token: 15 phút - 1 giờ
   - Refresh token: 7-30 ngày
3. **Token Storage**: Refresh token lưu trong database, access token chỉ ở memory
4. **Rate Limiting**: 
   - Login: 5 lần/phút per IP
   - Register: 3 lần/phút per IP
   - Forgot password: 3 lần/giờ per email
5. **CORS**: Cấu hình đúng origin
6. **HTTPS**: Bắt buộc trong production
7. **Token Refresh**: Implement concurrency-safe token refresh để tránh race condition

## Error Codes

- `400`: Bad Request (thiếu thông tin, format sai)
- `401`: Unauthorized (token không hợp lệ hoặc hết hạn)
- `403`: Forbidden (không có quyền)
- `404`: Not Found (user không tồn tại)
- `409`: Conflict (email đã tồn tại)
- `429`: Too Many Requests (vượt quá rate limit)
- `500`: Internal Server Error

## Notes

- Tất cả endpoints cần validate input
- Implement logging cho các hoạt động quan trọng (login, password change, etc.)
- Support multi-language error messages
- Implement account lockout sau N lần đăng nhập sai
- Email verification có thể optional hoặc required tùy business logic

