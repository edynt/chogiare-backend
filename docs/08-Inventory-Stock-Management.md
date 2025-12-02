# Inventory & Stock Management API Documentation

## Tổng quan
Quản lý kho hàng và tồn kho cho sellers, bao gồm nhập kho, xuất kho, cảnh báo tồn kho thấp.

## Endpoints

### 1. Lấy danh sách inventory items
**GET** `/api/inventory`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 20)
- `search`: string (tìm theo name, SKU)
- `categoryId`: uuid
- `status`: "in_stock" | "low_stock" | "out_of_stock" | "discontinued"
- `minStock`: number
- `maxStock`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "sku": "string",
        "category": "string",
        "currentStock": 10,
        "minStock": 5,
        "maxStock": 50,
        "reservedStock": 2,
        "availableStock": 8,
        "costPrice": 1000000,
        "sellingPrice": 1200000,
        "profit": 200000,
        "profitMargin": 16.67,
        "status": "in_stock",
        "lastUpdated": "ISO8601",
        "image": "string",
        "description": "string",
        "supplier": "string",
        "location": "string",
        "barcode": "string",
        "weight": 0.5,
        "dimensions": "20x15x8 cm",
        "tags": ["tag1"],
        "salesCount": 25,
        "viewsCount": 150,
        "rating": 4.5,
        "isActive": true
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

---

### 2. Lấy thông tin inventory item
**GET** `/api/inventory/{productId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Inventory item với đầy đủ thông tin */
  }
}
```

---

### 3. Nhập kho (Stock In)
**POST** `/api/inventory/stock-in`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "uuid (required)",
  "quantity": 10 (required),
  "costPrice": 1000000,
  "supplier": "string",
  "notes": "string",
  "date": "ISO8601"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": 10,
    "costPrice": 1000000,
    "supplier": "string",
    "notes": "string",
    "createdBy": "uuid",
    "createdAt": "ISO8601"
  }
}
```

**Logic:**
- Validate product thuộc về seller
- Tăng stock của product
- Tính lại availableStock = stock - reservedStock
- Tạo StockInRecord
- Update costPrice nếu có
- Tạo alert nếu stock vẫn < minStock sau khi nhập

---

### 4. Lấy lịch sử nhập kho
**GET** `/api/inventory/stock-in`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 20)
- `productId`: uuid
- `startDate`: ISO8601
- `endDate`: ISO8601

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "quantity": 10,
        "costPrice": 1000000,
        "supplier": "string",
        "notes": "string",
        "createdBy": "uuid",
        "createdByName": "string",
        "createdAt": "ISO8601"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

### 5. Cập nhật thông tin inventory
**PUT** `/api/inventory/{productId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "minStock": 5,
  "maxStock": 50,
  "costPrice": 1000000,
  "supplier": "string",
  "location": "string",
  "barcode": "string",
  "weight": 0.5,
  "dimensions": "20x15x8 cm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated inventory item */
  }
}
```

---

### 6. Lấy stock alerts
**GET** `/api/inventory/alerts`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `type`: "low_stock" | "out_of_stock"
- `isRead`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "string",
        "alertType": "low_stock",
        "message": "string",
        "createdAt": "ISO8601",
        "isRead": false
      }
    ],
    "total": 10,
    "unreadCount": 5
  }
}
```

---

### 7. Đánh dấu alert đã đọc
**PATCH** `/api/inventory/alerts/{alertId}/read`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert marked as read"
}
```

---

### 8. Lấy báo cáo inventory
**GET** `/api/inventory/report`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `startDate`: ISO8601
- `endDate`: ISO8601
- `categoryId`: uuid
- `status`: string

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalProducts": 100,
      "totalValue": 100000000,
      "inStock": 80,
      "lowStock": 15,
      "outOfStock": 5,
      "totalStockIn": 1000,
      "totalStockOut": 500,
      "totalCost": 50000000,
      "totalSales": 75000000,
      "totalProfit": 25000000,
      "profitMargin": 33.33
    },
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "string",
        "productCount": 20,
        "totalValue": 20000000,
        "inStock": 15,
        "lowStock": 3,
        "outOfStock": 2
      }
    ],
    "lowStockProducts": [
      /* Array of products với stock < minStock */
    ],
    "outOfStockProducts": [
      /* Array of products với stock = 0 */
    ],
    "topSellingProducts": [
      {
        "productId": "uuid",
        "productName": "string",
        "salesCount": 100,
        "revenue": 10000000
      }
    ]
  }
}
```

---

### 9. Export inventory report
**GET** `/api/inventory/report/export`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:** Tương tự GET /inventory/report

**Response:**
- File download (CSV hoặc Excel)

---

### 10. Import products (Bulk)
**POST** `/api/inventory/import`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: File (CSV hoặc Excel)

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "message": "Invalid SKU"
      }
    ]
  }
}
```

**Logic:**
- Parse CSV/Excel file
- Validate từng row
- Create products
- Return summary với errors nếu có

---

## Database Schema

### Table: Products
Xem trong Product Management documentation

### Table: StockInRecords
```sql
- id: autoincrement (PK)
- product_id: uuid (FK -> Products.id, not null)
- quantity: int (not null)
- cost_price: decimal
- supplier: text
- notes: text
- created_by: uuid (FK -> Users.id)
- created_at: int64 (not null)
```

### Table: StockAlerts
```sql
- id: autoincrement (PK)
- product_id: uuid (FK -> Products.id, not null)
- alert_type: text ('low_stock' | 'out_of_stock')
- message: text
- is_read: boolean (default: false)
- created_at: int64 (not null)
```

## Business Logic

1. **Stock Calculation**:
   - `stock`: Tổng số lượng trong kho
   - `reservedStock`: Số lượng đã reserve cho orders
   - `availableStock`: stock - reservedStock
   - Auto-update availableStock khi stock hoặc reservedStock thay đổi

2. **Stock Status**:
   - `in_stock`: stock >= minStock
   - `low_stock`: stock < minStock và stock > 0
   - `out_of_stock`: stock = 0
   - `discontinued`: Sản phẩm ngừng kinh doanh

3. **Stock Alerts**:
   - Tạo alert khi stock < minStock
   - Tạo alert khi stock = 0
   - Alert tự động khi có thay đổi stock
   - Mark alert as read khi user xem

4. **Stock In**:
   - Tăng stock khi nhập kho
   - Lưu lịch sử nhập kho
   - Update costPrice nếu có
   - Tính lại profit và profitMargin

5. **Stock Out**:
   - Tự động khi có order completed
   - Trừ stock và reservedStock
   - Lưu vào lịch sử (nếu cần)

6. **Profit Calculation**:
   - `profit` = sellingPrice - costPrice
   - `profitMargin` = (profit / sellingPrice) * 100
   - Tính cho từng sản phẩm
   - Tính tổng trong reports

7. **Inventory Reports**:
   - Summary: Tổng quan inventory
   - By Category: Phân tích theo danh mục
   - Low Stock: Sản phẩm sắp hết
   - Out of Stock: Sản phẩm hết hàng
   - Top Selling: Sản phẩm bán chạy

## Permissions

- **View inventory**: Seller (own products) or Admin
- **Stock in**: Seller (own products) or Admin
- **Update inventory**: Seller (own products) or Admin
- **View alerts**: Seller (own products) or Admin
- **View reports**: Seller (own products) or Admin
- **Import products**: Seller or Admin

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Product not found
- `409`: Conflict (stock không đủ)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Auto-create alerts khi stock thay đổi
- Support bulk operations (import/export)
- Cache inventory stats để tăng performance
- Track stock history để audit
- Support multiple warehouses/locations
- Calculate reorder point dựa trên sales history
- Support barcode scanning
- Integration với barcode scanner
- Support unit conversion (nếu có nhiều đơn vị)
- Track expiry date (nếu có sản phẩm có hạn sử dụng)

