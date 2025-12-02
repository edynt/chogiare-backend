# Product & Category Management API Documentation

## Tổng quan
Quản lý sản phẩm và danh mục sản phẩm trong hệ thống marketplace.

## Product Endpoints

### 1. Lấy danh sách products
**GET** `/api/products`

**Query Parameters:**
- `query`: string (search text)
- `categoryId`: uuid
- `minPrice`: number
- `maxPrice`: number
- `condition`: "new" | "like_new" | "good" | "fair" | "poor"
- `location`: string
- `sellerId`: uuid
- `badges`: string[] (["NEW", "FEATURED", "PROMO", "HOT", "SALE"])
- `rating`: number
- `minRating`: number
- `featured`: boolean
- `promoted`: boolean
- `sortBy`: string ("price", "createdAt", "rating", "viewCount")
- `sortOrder`: "asc" | "desc"
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `offset`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "price": 1000000,
        "originalPrice": 1200000,
        "categoryId": "uuid",
        "category": {
          "id": "uuid",
          "name": "string",
          "slug": "string"
        },
        "images": ["url1", "url2"],
        "condition": "new",
        "tags": ["tag1", "tag2"],
        "location": "string",
        "stock": 10,
        "sellerId": "uuid",
        "seller": {
          "id": "uuid",
          "name": "string",
          "avatar": "string"
        },
        "store": {
          "id": "uuid",
          "name": "string",
          "logo": "string"
        },
        "status": "active",
        "badges": ["NEW", "FEATURED"],
        "rating": 4.5,
        "reviewCount": 25,
        "viewCount": 150,
        "isFeatured": true,
        "isPromoted": false,
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalPages": 50
  }
}
```

---

### 2. Lấy thông tin product theo ID
**GET** `/api/products/{productId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* Product object với đầy đủ thông tin */
  }
}
```

**Logic:**
- Tăng viewCount khi có người xem
- Chỉ hiển thị products có status = "active"
- Include seller info và store info

---

### 3. Tạo product mới (Seller only)
**POST** `/api/products`

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "price": 1000000,
  "originalPrice": 1200000,
  "categoryId": "uuid (required)",
  "images": ["url1", "url2"] (required, min 1),
  "condition": "new" | "like_new" | "good" | "fair" | "poor" (required),
  "tags": ["tag1", "tag2"],
  "location": "string",
  "stock": 10 (default: 0),
  "status": "draft" | "active" (default: "draft")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Created Product object */
  }
}
```

**Logic:**
- Validate seller có store (nếu required)
- Validate category tồn tại
- Validate images URLs
- Set sellerId từ authenticated user
- Set storeId từ user's store
- Default status = "draft" (cần admin approve nếu có moderation)

---

### 4. Cập nhật product
**PUT** `/api/products/{productId}`

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "price": 1000000,
  "originalPrice": 1200000,
  "categoryId": "uuid",
  "images": ["url1", "url2"],
  "condition": "new",
  "tags": ["tag1"],
  "location": "string",
  "stock": 10,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Product object */
  }
}
```

**Logic:**
- Chỉ seller sở hữu product mới được update
- Admin có thể update bất kỳ product nào
- Validate dữ liệu mới
- Nếu status thay đổi, có thể cần admin approval

---

### 5. Xóa product
**DELETE** `/api/products/{productId}`

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Logic:**
- Soft delete (set status = "archived") hoặc hard delete
- Không cho phép xóa nếu có đơn hàng đang pending
- Xóa các images liên quan

---

### 6. Tìm kiếm products
**GET** `/api/products/search`

**Query Parameters:** Tương tự GET /products nhưng bắt buộc có `query`

**Response:**
```json
{
  "success": true,
  "data": {
    /* PaginatedResponse<Product> */
  }
}
```

**Logic:**
- Full-text search trên title, description, tags
- Có thể dùng Elasticsearch hoặc database full-text search
- Sort by relevance hoặc các tiêu chí khác

---

### 7. Lấy products theo category
**GET** `/api/categories/{categoryId}/products`

**Query Parameters:** Tương tự GET /products

**Response:**
```json
{
  "success": true,
  "data": {
    /* PaginatedResponse<Product> */
  }
}
```

---

### 8. Lấy products theo store
**GET** `/api/stores/{storeId}/products`

**Query Parameters:** Tương tự GET /products

**Response:**
```json
{
  "success": true,
  "data": {
    /* PaginatedResponse<Product> */
  }
}
```

---

### 9. Lấy featured products
**GET** `/api/products/featured`

**Query Parameters:**
- `limit`: number (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    /* Array of Product objects */
  ]
}
```

**Logic:**
- Lấy products có isFeatured = true
- Sort by createdAt hoặc priority
- Limit số lượng

---

### 10. Lấy products của seller (My Products)
**GET** `/api/seller/products`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:** Tương tự GET /products

**Response:**
```json
{
  "success": true,
  "data": {
    /* PaginatedResponse<Product> */
  }
}
```

---

### 11. Bulk update products
**PATCH** `/api/products/bulk`

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid",
      "data": {
        "status": "active",
        "price": 1000000
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    /* Array of updated Product objects */
  ]
}
```

---

### 12. Cập nhật status product
**PATCH** `/api/products/{productId}/status`

**Request Body:**
```json
{
  "status": "draft" | "active" | "sold" | "archived" | "suspended"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Product object */
  }
}
```

**Logic:**
- Seller có thể set: draft, active, archived
- Admin có thể set: tất cả status
- Validate transition hợp lệ (ví dụ: không thể từ "sold" về "active")

---

### 13. Cập nhật stock
**PATCH** `/api/products/{productId}/stock`

**Request Body:**
```json
{
  "stock": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Product object */
  }
}
```

**Logic:**
- Update stock
- Tự động cập nhật availableStock = stock - reservedStock
- Tạo alert nếu stock < minStock

---

### 14. Lấy thống kê product
**GET** `/api/products/{productId}/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "views": 150,
    "sales": 25,
    "rating": 4.5
  }
}
```

---

### 15. Tăng view count
**POST** `/api/products/{productId}/views`

**Response:**
```json
{
  "success": true,
  "message": "View count incremented"
}
```

**Logic:**
- Increment viewCount
- Có thể track unique views (cần check user đã xem chưa)
- Có thể dùng cache để giảm database writes

---

## Category Endpoints

### 1. Lấy danh sách categories
**GET** `/api/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string",
      "image": "string",
      "parentId": "uuid",
      "children": [
        /* Array of Category objects */
      ],
      "productCount": 100,
      "isActive": true,
      "createdAt": "ISO8601"
    }
  ]
}
```

**Logic:**
- Trả về tree structure (parent-children)
- Chỉ trả về categories có isActive = true
- Include productCount

---

### 2. Lấy category theo ID
**GET** `/api/categories/{categoryId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* Category object */
  }
}
```

---

### 3. Tạo category (Admin only)
**POST** `/api/categories`

**Request Body:**
```json
{
  "name": "string (required)",
  "slug": "string (required, unique)",
  "description": "string",
  "image": "string",
  "parentId": "uuid (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Created Category object */
  }
}
```

---

### 4. Cập nhật category (Admin only)
**PUT** `/api/categories/{categoryId}`

**Request Body:**
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "image": "string",
  "parentId": "uuid",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Category object */
  }
}
```

---

### 5. Xóa category (Admin only)
**DELETE** `/api/categories/{categoryId}`

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Logic:**
- Không cho phép xóa nếu có products
- Không cho phép xóa nếu có subcategories
- Hoặc chuyển products sang category khác

---

### 6. Lấy subcategories
**GET** `/api/categories/{categoryId}/subcategories`

**Response:**
```json
{
  "success": true,
  "data": [
    /* Array of Category objects */
  ]
}
```

---

### 7. Lấy thống kê category
**GET** `/api/categories/{categoryId}/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "productCount": 100,
    "subcategoryCount": 5
  }
}
```

---

## Database Schema

### Table: Products
```sql
- id: uuid (PK)
- title: text (not null)
- description: text
- price: decimal (not null)
- original_price: decimal
- category_id: uuid (FK -> Categories.id)
- seller_id: uuid (FK -> Users.id)
- store_id: uuid (FK -> Stores.id)
- condition: product_condition (not null)
- tags: text[] (array)
- location: text
- stock: int (default: 0)
- min_stock: int (default: 0)
- max_stock: int
- reserved_stock: int (default: 0)
- available_stock: int (default: 0)
- cost_price: decimal
- selling_price: decimal
- profit: decimal
- profit_margin: decimal
- sku: text (unique)
- barcode: text
- weight: decimal
- dimensions: text
- supplier: text
- status: product_status (default: 'draft')
- badges: product_badge[] (array)
- rating: decimal (default: 0)
- review_count: int (default: 0)
- view_count: int (default: 0)
- sales_count: int (default: 0)
- is_featured: boolean (default: false)
- is_promoted: boolean (default: false)
- is_active: boolean (default: true)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: ProductImages
```sql
- id: autoincrement (PK)
- product_id: uuid (FK -> Products.id)
- image_url: text (not null)
- display_order: int (default: 0)
- created_at: int64 (not null)
```

### Table: Categories
```sql
- id: uuid (PK)
- name: text (not null)
- slug: text (unique, not null)
- description: text
- image: text
- parent_id: uuid (FK -> Categories.id)
- product_count: int (default: 0)
- is_active: boolean (default: true)
- created_at: int64 (not null)
```

## Enums

### ProductCondition
- `new`: Mới
- `like_new`: Như mới
- `good`: Tốt
- `fair`: Khá
- `poor`: Kém

### ProductStatus
- `draft`: Bản nháp
- `active`: Đang bán
- `sold`: Đã bán
- `archived`: Đã lưu trữ
- `suspended`: Bị treo

### ProductBadge
- `NEW`: Mới
- `FEATURED`: Nổi bật
- `PROMO`: Khuyến mãi
- `HOT`: Hot
- `SALE`: Giảm giá

## Business Logic

1. **Product Status Flow**:
   - draft → active (seller publish hoặc admin approve)
   - active → sold (khi có order completed)
   - active → archived (seller tự archive)
   - active → suspended (admin suspend)

2. **Stock Management**:
   - availableStock = stock - reservedStock
   - Khi có order, reserve stock
   - Khi order completed, trừ stock
   - Khi order cancelled, release reserved stock

3. **Featured/Promoted Products**:
   - Featured: Admin set hoặc tự động dựa trên rating/sales
   - Promoted: Seller mua boost package

4. **Search & Filter**:
   - Full-text search trên title, description, tags
   - Filter theo nhiều tiêu chí
   - Sort theo price, rating, createdAt, viewCount

5. **Category Hierarchy**:
   - Support multi-level categories
   - Validate không có circular reference
   - Update productCount khi có products mới

## Permissions

- **View products**: Public
- **Create product**: Seller only
- **Update own product**: Seller owner
- **Update any product**: Admin
- **Delete own product**: Seller owner
- **Delete any product**: Admin
- **Manage categories**: Admin only

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Product/Category not found
- `409`: Conflict (slug đã tồn tại)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Implement caching cho featured products và categories
- Index database cho search performance
- Validate image URLs và file sizes
- Support image upload qua separate endpoint
- Track product views để analytics
- Auto-update productCount trong categories

