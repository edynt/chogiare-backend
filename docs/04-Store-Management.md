# Store Management API Documentation

## Tổng quan
Quản lý cửa hàng (store) của sellers trong hệ thống marketplace.

## Endpoints

### 1. Tạo store mới
**POST** `/api/stores`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "logo": "string",
  "banner": "string",
  "website": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "isVerified": false,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": 123,
    "name": "string",
    "description": "string",
    "logo": "string",
    "banner": "string",
    "website": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "rating": 0,
    "reviewCount": 0,
    "productCount": 0,
    "followerCount": 0,
    "isVerified": false,
    "isActive": true,
    "userName": "string",
    "userEmail": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Mỗi user chỉ có thể có 1 store
- Set userId từ authenticated user
- Default isVerified = false (cần admin verify)
- Default isActive = true

---

### 2. Lấy thông tin store theo ID
**GET** `/api/stores/{storeId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* Store object */
  }
}
```

---

### 3. Lấy store của user hiện tại
**GET** `/api/stores/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Store object */
  }
}
```

---

### 4. Lấy danh sách stores
**GET** `/api/stores`

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `search`: string
- `isVerified`: boolean
- `isActive`: boolean
- `city`: string
- `state`: string
- `country`: string

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": [
      /* Array of Store objects */
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

### 5. Tìm kiếm stores
**GET** `/api/stores/search`

**Query Parameters:**
- `q`: string (search query)
- `page`: number
- `pageSize`: number

**Response:**
```json
{
  "success": true,
  "data": {
    /* StoreListResponse */
  }
}
```

---

### 6. Cập nhật store
**PUT** `/api/stores/{storeId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "logo": "string",
  "banner": "string",
  "website": "string",
  "phone": "string",
  "email": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postalCode": "string",
  "isVerified": false,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Store object */
  }
}
```

**Logic:**
- Chỉ owner hoặc admin mới được update
- isVerified chỉ admin mới được set
- Validate dữ liệu

---

### 7. Xóa store
**DELETE** `/api/stores/{storeId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Store deleted successfully"
}
```

**Logic:**
- Chỉ owner hoặc admin mới được xóa
- Soft delete (set isActive = false) hoặc hard delete
- Không cho phép xóa nếu có products đang active
- Không cho phép xóa nếu có orders đang pending

---

### 8. Lấy thống kê stores (Admin)
**GET** `/api/stores/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStores": 1000,
    "activeStores": 800,
    "verifiedStores": 600,
    "averageRating": 4.5,
    "totalProducts": 5000,
    "totalFollowers": 10000
  }
}
```

---

### 9. Lấy thống kê store của user
**GET** `/api/stores/stats/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* StoreStats object */
  }
}
```

---

### 10. Lấy thống kê store theo ID
**GET** `/api/stores/stats/{storeId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* StoreStats object */
  }
}
```

---

## Database Schema

### Table: Stores
```sql
- id: uuid (PK)
- user_id: uuid (FK -> Users.id, not null)
- name: text (not null)
- slug: text (unique, not null)
- description: text
- short_description: text
- logo: text
- banner: text
- category: text
- subcategory: text
- established_year: int
- business_type: text ('individual' | 'company')
- tax_code: text
- business_license: text
- address_street: text
- address_ward: text
- address_district: text
- address_city: text
- address_postal_code: text
- address_lat: decimal
- address_lng: decimal
- contact_phone: text
- contact_email: text
- contact_website: text
- contact_facebook: text
- contact_instagram: text
- contact_tiktok: text
- contact_youtube: text
- business_hours_monday_open: text
- business_hours_monday_close: text
- business_hours_monday_is_open: boolean
- business_hours_tuesday_open: text
- business_hours_tuesday_close: text
- business_hours_tuesday_is_open: boolean
- business_hours_wednesday_open: text
- business_hours_wednesday_close: text
- business_hours_wednesday_is_open: boolean
- business_hours_thursday_open: text
- business_hours_thursday_close: text
- business_hours_thursday_is_open: boolean
- business_hours_friday_open: text
- business_hours_friday_close: text
- business_hours_friday_is_open: boolean
- business_hours_saturday_open: text
- business_hours_saturday_close: text
- business_hours_saturday_is_open: boolean
- business_hours_sunday_open: text
- business_hours_sunday_close: text
- business_hours_sunday_is_open: boolean
- return_policy: text
- shipping_policy: text
- rating: decimal (default: 0)
- review_count: int (default: 0)
- product_count: int (default: 0)
- follower_count: int (default: 0)
- is_verified: boolean (default: false)
- is_active: boolean (default: true)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

## Business Logic

1. **Store Creation**:
   - Mỗi user chỉ có thể có 1 store
   - Cần có role "seller" để tạo store
   - Store mới tạo có isVerified = false

2. **Store Verification**:
   - Admin verify store sau khi kiểm tra thông tin
   - Verified stores có badge và được ưu tiên hiển thị
   - Có thể yêu cầu business license, tax code

3. **Store Rating**:
   - Tính từ reviews của products trong store
   - Auto-update khi có review mới
   - Formula: average of all product ratings

4. **Store Statistics**:
   - productCount: Tổng số products active
   - reviewCount: Tổng số reviews
   - followerCount: Số người follow store (nếu có feature này)
   - rating: Điểm đánh giá trung bình

5. **Store Status**:
   - isActive = false: Store bị khóa, không hiển thị products
   - isVerified = true: Store đã được xác thực

6. **Business Hours**:
   - Lưu giờ mở cửa theo từng ngày
   - Support closed days (is_open = false)

## Permissions

- **View stores**: Public
- **Create store**: Seller only (1 store per user)
- **Update own store**: Store owner
- **Update any store**: Admin
- **Delete own store**: Store owner
- **Delete any store**: Admin
- **Verify store**: Admin only
- **View stats**: Public (own store) or Admin (all stores)

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Store not found
- `409`: Conflict (user đã có store)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Validate slug uniqueness
- Auto-generate slug từ name nếu không có
- Support store following (nếu có feature)
- Cache store stats để tăng performance
- Support store search với full-text search
- Track store views để analytics
- Auto-update productCount, reviewCount, rating

