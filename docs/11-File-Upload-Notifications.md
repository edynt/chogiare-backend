# File Upload & Notifications API Documentation

## Tổng quan
Hệ thống upload file (images, documents) và gửi thông báo cho users.

## File Upload Endpoints

### 1. Upload single file
**POST** `/api/upload/file`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: File (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/files/abc123.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "ISO8601"
  }
}
```

**Logic:**
- Validate file type (images, documents)
- Validate file size (max 10MB cho images, 50MB cho documents)
- Upload lên cloud storage (S3, Cloudinary, etc.)
- Generate unique filename
- Return file URL

---

### 2. Upload multiple files
**POST** `/api/upload/files`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `files`: File[] (multiple files)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/files/abc123.jpg",
      "filename": "image1.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "uploadedAt": "ISO8601"
    }
  ]
}
```

---

### 3. Upload product images
**POST** `/api/upload/product-images`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `productId`: string (required)
- `images`: File[] (required, multiple files)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "url": "https://cdn.example.com/products/abc123.jpg",
      "filename": "product1.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg",
      "uploadedAt": "ISO8601"
    }
  ]
}
```

**Logic:**
- Validate product thuộc về seller
- Upload images
- Link images với product trong ProductImages table
- Set display_order

---

### 4. Upload store image (logo/banner)
**POST** `/api/upload/store-image`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `storeId`: string (required)
- `type`: "logo" | "banner" (required)
- `file`: File (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/stores/logo123.jpg",
    "filename": "logo.jpg",
    "size": 512000,
    "mimeType": "image/jpeg",
    "uploadedAt": "ISO8601"
  }
}
```

**Logic:**
- Validate store thuộc về seller
- Upload image
- Update store.logo hoặc store.banner
- Delete old image nếu có

---

### 5. Upload avatar
**POST** `/api/upload/avatar`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `avatar`: File (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/avatars/user123.jpg",
    "filename": "avatar.jpg",
    "size": 256000,
    "mimeType": "image/jpeg",
    "uploadedAt": "ISO8601"
  }
}
```

**Logic:**
- Upload avatar
- Update user.avatar
- Delete old avatar nếu có
- Resize image (nếu cần)

---

### 6. Xóa file
**DELETE** `/api/upload/files/{fileId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Logic:**
- Validate file thuộc về user
- Xóa file khỏi cloud storage
- Xóa record trong database

---

### 7. Lấy thông tin file
**GET** `/api/upload/files/{fileId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://cdn.example.com/files/abc123.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "ISO8601"
  }
}
```

---

### 8. Lấy danh sách files của user
**GET** `/api/upload/files`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      /* Array of UploadResult objects */
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

## Notifications Endpoints

### 1. Lấy danh sách notifications
**GET** `/api/notifications`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 20)
- `type`: "order" | "product" | "payment" | "system" | "promotion"
- `isRead`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "userId": 123,
        "type": "order",
        "title": "Đơn hàng mới",
        "message": "Bạn có đơn hàng mới #12345",
        "actionUrl": "/orders/12345",
        "isRead": false,
        "createdAt": "ISO8601"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3,
    "unreadCount": 5
  }
}
```

---

### 2. Đánh dấu notification đã đọc
**PATCH** `/api/notifications/{notificationId}/read`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 3. Đánh dấu tất cả notifications đã đọc
**POST** `/api/notifications/read-all`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 4. Xóa notification
**DELETE** `/api/notifications/{notificationId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 5. Lấy số lượng notifications chưa đọc
**GET** `/api/notifications/unread-count`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

## Database Schema

### Table: Notifications
```sql
- id: uuid (PK)
- user_id: uuid (FK -> Users.id, not null)
- type: notification_type (not null)
- title: text (not null)
- message: text (not null)
- action_url: text
- is_read: boolean (default: false)
- created_at: int64 (not null)
```

## Enums

### NotificationType
- `order`: Thông báo về đơn hàng
- `product`: Thông báo về sản phẩm
- `payment`: Thông báo về thanh toán
- `system`: Thông báo hệ thống
- `promotion`: Thông báo khuyến mãi

## Business Logic

### File Upload

1. **File Types**:
   - Images: jpg, jpeg, png, gif, webp
   - Documents: pdf, doc, docx, xls, xlsx
   - Max size: 10MB cho images, 50MB cho documents

2. **Storage**:
   - Upload lên cloud storage (AWS S3, Cloudinary, etc.)
   - Generate unique filename để tránh conflict
   - Support CDN để tăng tốc độ load

3. **Image Processing**:
   - Resize images (nếu cần)
   - Generate thumbnails
   - Optimize images (compress)

4. **File Management**:
   - Track files trong database
   - Link files với resources (products, stores, users)
   - Cleanup orphaned files (files không được sử dụng)

### Notifications

1. **Notification Types**:
   - **Order**: Đơn hàng mới, đơn hàng đã xác nhận, đơn hàng đã giao, etc.
   - **Product**: Sản phẩm đã được duyệt, sản phẩm bị từ chối, etc.
   - **Payment**: Thanh toán thành công, thanh toán thất bại, etc.
   - **System**: Thông báo hệ thống, maintenance, etc.
   - **Promotion**: Khuyến mãi mới, boost package, etc.

2. **Notification Delivery**:
   - In-app notifications (database)
   - Email notifications (optional)
   - Push notifications (nếu có mobile app)
   - SMS notifications (optional)

3. **Notification Lifecycle**:
   - Tạo notification khi có event
   - Mark as read khi user xem
   - Auto-delete old notifications (sau N ngày)
   - Support notification preferences (user có thể tắt một số loại)

4. **Real-time Updates**:
   - WebSocket hoặc Server-Sent Events (SSE)
   - Push notification count real-time
   - Show notification badge

## Permissions

- **Upload files**: Authenticated users
- **View own files**: File owner
- **Delete own files**: File owner
- **Delete any files**: Admin
- **View own notifications**: User
- **View all notifications**: Admin
- **Send notifications**: System/Admin

## Error Codes

- `400`: Bad Request (file quá lớn, format không hợp lệ)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: File/Notification not found
- `413`: Payload Too Large
- `415`: Unsupported Media Type
- `500`: Internal Server Error

## Notes

- Validate file types và sizes trước khi upload
- Support progress tracking cho large files
- Support chunked upload cho files lớn
- Implement rate limiting cho upload endpoints
- Support image optimization và compression
- Cleanup unused files định kỳ
- Support notification preferences
- Implement notification batching (gộp nhiều notifications cùng loại)
- Support notification templates
- Track notification delivery status
- Support notification scheduling
- Support notification targeting (theo user segment)

