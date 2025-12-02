# Cart & Order Management API Documentation

## Tổng quan
Quản lý giỏ hàng và đơn hàng trong hệ thống marketplace.

## Cart Endpoints

### 1. Lấy giỏ hàng
**GET** `/api/cart`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": 123,
    "items": [
      {
        "id": "uuid",
        "cartId": "uuid",
        "productId": "uuid",
        "quantity": 2,
        "price": 1000000,
        "productName": "string",
        "productImage": "string",
        "productPrice": 1000000,
        "productStock": 10,
        "productStatus": "active",
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Mỗi user có 1 cart duy nhất
- Auto-create cart nếu chưa có
- Include product info trong items

---

### 2. Xóa toàn bộ giỏ hàng
**DELETE** `/api/cart`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

### 3. Lấy thống kê giỏ hàng
**GET** `/api/cart/stats`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalItems": 5,
    "totalValue": 5000000,
    "uniqueProducts": 3
  }
}
```

---

### 4. Thêm sản phẩm vào giỏ hàng
**POST** `/api/cart/items`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "uuid (required)",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* CartItem object */
  }
}
```

**Logic:**
- Validate product tồn tại và active
- Validate stock đủ
- Nếu product đã có trong cart, tăng quantity
- Nếu chưa có, tạo cart item mới
- Validate quantity không vượt quá stock

---

### 5. Cập nhật số lượng sản phẩm
**PATCH** `/api/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated CartItem object */
  }
}
```

**Logic:**
- Validate quantity > 0
- Validate stock đủ
- Update quantity
- Nếu quantity = 0, có thể xóa item

---

### 6. Xóa sản phẩm khỏi giỏ hàng
**DELETE** `/api/cart/items/{itemId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Order Endpoints

### 1. Tạo đơn hàng
**POST** `/api/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "storeId": "uuid (required)",
  "paymentMethod": "momo" | "zalopay" | "stripe" | "paypal" | "bank_transfer",
  "shippingAddress": "string (required)",
  "billingAddress": "string (required)",
  "notes": "string (optional)",
  "items": [
    {
      "productId": "uuid (required)",
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": 123,
    "storeId": "uuid",
    "status": "pending",
    "paymentStatus": "pending",
    "paymentMethod": "bank_transfer",
    "subtotal": 1000000,
    "tax": 0,
    "shipping": 0,
    "discount": 0,
    "total": 1000000,
    "currency": "VND",
    "shippingAddress": "string",
    "billingAddress": "string",
    "notes": "string",
    "storeName": "string",
    "storeLogo": "string",
    "userEmail": "string",
    "userName": "string",
    "items": [
      {
        "id": "uuid",
        "orderId": "uuid",
        "productId": "uuid",
        "productName": "string",
        "productImage": "string",
        "price": 1000000,
        "quantity": 1,
        "subtotal": 1000000,
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Validate tất cả products tồn tại và active
- Validate stock đủ cho tất cả items
- Reserve stock (tăng reservedStock)
- Tính subtotal, tax, shipping, discount, total
- Tạo order với status = "pending"
- Tạo order items
- Clear cart nếu order từ cart
- Gửi notification cho seller

---

### 2. Lấy thông tin đơn hàng
**GET** `/api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Order object với đầy đủ thông tin */
  }
}
```

**Logic:**
- Chỉ buyer, seller của order, hoặc admin mới được xem
- Include order items và product info

---

### 3. Lấy danh sách đơn hàng
**GET** `/api/orders`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `status`: string
- `paymentStatus`: string
- `storeId`: uuid

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      /* Array of Order objects */
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

**Logic:**
- Admin: xem tất cả orders
- Seller: xem orders của store mình
- Buyer: xem orders của mình

---

### 4. Lấy đơn hàng của user
**GET** `/api/orders/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:** Tương tự GET /orders

**Response:**
```json
{
  "success": true,
  "data": {
    /* OrderListResponse */
  }
}
```

---

### 5. Lấy đơn hàng của store
**GET** `/api/orders/store/{storeId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:** Tương tự GET /orders

**Response:**
```json
{
  "success": true,
  "data": {
    /* OrderListResponse */
  }
}
```

**Logic:**
- Chỉ seller của store hoặc admin mới được xem

---

### 6. Cập nhật đơn hàng
**PUT** `/api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "string (optional)",
  "paymentStatus": "string (optional)",
  "paymentMethod": "string (optional)",
  "shippingAddress": "string (optional)",
  "billingAddress": "string (optional)",
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Order object */
  }
}
```

**Logic:**
- Buyer có thể update: notes, shippingAddress
- Seller có thể update: status, sellerNotes
- Admin có thể update: tất cả

---

### 7. Cập nhật status đơn hàng
**PATCH** `/api/orders/{orderId}/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "pending" | "confirmed" | "ready_for_pickup" | "completed" | "cancelled" | "refunded"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Order object */
  }
}
```

**Logic:**
- Validate status transition hợp lệ
- Khi status = "confirmed": Gửi notification cho buyer
- Khi status = "ready_for_pickup": Gửi notification cho buyer
- Khi status = "completed": 
  - Trừ stock thực tế
  - Release reserved stock
  - Cập nhật sales count của products
  - Cho phép review
- Khi status = "cancelled":
  - Release reserved stock
  - Refund nếu đã thanh toán
- Khi status = "refunded":
  - Refund payment
  - Release stock

---

### 8. Xác nhận đơn hàng (Seller)
**PATCH** `/api/orders/{orderId}/confirm`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "sellerNotes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Order object với status = "confirmed" */
  }
}
```

**Logic:**
- Chỉ seller của store mới được confirm
- Set status = "confirmed"
- Lưu sellerNotes
- Gửi notification cho buyer

---

### 9. Cập nhật payment status
**PATCH** `/api/orders/{orderId}/payment-status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "paymentStatus": "pending" | "completed" | "failed" | "refunded"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Order object */
  }
}
```

**Logic:**
- Khi paymentStatus = "completed":
  - Có thể tự động confirm order
  - Gửi notification
- Khi paymentStatus = "refunded":
  - Set order status = "refunded"
  - Release stock

---

### 10. Xóa đơn hàng
**DELETE** `/api/orders/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

**Logic:**
- Chỉ cho phép xóa nếu status = "pending" hoặc "cancelled"
- Soft delete hoặc hard delete
- Admin có thể xóa bất kỳ order nào

---

### 11. Lấy thống kê đơn hàng
**GET** `/api/orders/stats`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "pendingOrders": 50,
    "processingOrders": 30,
    "shippedOrders": 20,
    "deliveredOrders": 800,
    "cancelledOrders": 100,
    "totalRevenue": 100000000,
    "averageOrderValue": 100000
  }
}
```

**Logic:**
- Admin: stats của tất cả orders
- Seller: stats của store
- Buyer: stats của user

---

### 12. Lấy thống kê đơn hàng của store
**GET** `/api/orders/stats/store/{storeId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* OrderStats object */
  }
}
```

---

### 13. Lấy thống kê đơn hàng của user
**GET** `/api/orders/stats/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* OrderStats object */
  }
}
```

---

## Database Schema

### Table: Carts
```sql
- id: uuid (PK)
- user_id: uuid (unique, FK -> Users.id, not null)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: CartItems
```sql
- id: uuid (PK)
- cart_id: uuid (FK -> Carts.id, not null)
- product_id: uuid (FK -> Products.id, not null)
- quantity: int (not null)
- price: decimal (not null)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: Orders
```sql
- id: uuid (PK)
- user_id: uuid (FK -> Users.id, not null)
- store_id: uuid (FK -> Stores.id, not null)
- status: order_status (default: 'pending')
- payment_status: payment_status (default: 'pending')
- payment_method: payment_method
- subtotal: decimal (not null)
- tax: decimal (default: 0)
- shipping: decimal (default: 0)
- discount: decimal (default: 0)
- total: decimal (not null)
- currency: text (default: 'VND')
- shipping_address_id: uuid (FK -> Addresses.id)
- billing_address_id: uuid (FK -> Addresses.id)
- notes: text
- seller_notes: text
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: OrderItems
```sql
- id: uuid (PK)
- order_id: uuid (FK -> Orders.id, not null)
- product_id: uuid (FK -> Products.id, not null)
- product_name: text (not null)
- product_image: text
- price: decimal (not null)
- quantity: int (not null)
- subtotal: decimal (not null)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

## Enums

### OrderStatus
- `pending`: Chờ xác nhận
- `confirmed`: Đã xác nhận
- `ready_for_pickup`: Sẵn sàng lấy hàng
- `completed`: Hoàn thành
- `cancelled`: Đã hủy
- `refunded`: Đã hoàn tiền

### PaymentStatus
- `pending`: Chờ thanh toán
- `completed`: Đã thanh toán
- `failed`: Thanh toán thất bại
- `refunded`: Đã hoàn tiền

### PaymentMethod
- `momo`: Ví MoMo
- `zalopay`: ZaloPay
- `stripe`: Stripe
- `paypal`: PayPal
- `bank_transfer`: Chuyển khoản ngân hàng

## Business Logic

1. **Cart Management**:
   - Mỗi user có 1 cart duy nhất
   - Auto-create cart khi thêm item đầu tiên
   - Validate stock khi thêm/cập nhật item
   - Price lưu tại thời điểm thêm vào cart (snapshot)

2. **Order Creation**:
   - Validate stock trước khi tạo order
   - Reserve stock ngay khi tạo order
   - Tính toán giá tại thời điểm tạo order
   - Lưu product info snapshot (tên, giá, hình) vào order items

3. **Order Status Flow**:
   - pending → confirmed (seller confirm)
   - confirmed → ready_for_pickup (seller chuẩn bị xong)
   - ready_for_pickup → completed (buyer nhận hàng)
   - Bất kỳ status nào → cancelled (hủy)
   - completed → refunded (hoàn tiền)

4. **Stock Management**:
   - Khi tạo order: Reserve stock (reservedStock++)
   - Khi order completed: Trừ stock (stock--, reservedStock--)
   - Khi order cancelled: Release stock (reservedStock--)
   - availableStock = stock - reservedStock

5. **Payment Processing**:
   - Payment có thể xử lý qua third-party (MoMo, ZaloPay, etc.)
   - Webhook để update payment status
   - Manual update payment status (cho bank transfer)

6. **Order Calculation**:
   - subtotal = sum(orderItems.subtotal)
   - tax = subtotal * taxRate (nếu có)
   - shipping = calculateShipping() (nếu có)
   - discount = calculateDiscount() (nếu có)
   - total = subtotal + tax + shipping - discount

## Permissions

- **View own cart**: Buyer only
- **Manage own cart**: Buyer only
- **View own orders**: Buyer only
- **View store orders**: Seller of store
- **View all orders**: Admin
- **Create order**: Buyer only
- **Update order status**: Seller (own store) or Admin
- **Cancel order**: Buyer (own order) or Admin
- **View stats**: Owner or Admin

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Order/Cart not found
- `409`: Conflict (stock không đủ)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Implement cart expiration (xóa cart cũ sau N ngày)
- Validate stock real-time khi checkout
- Support order cancellation với refund policy
- Track order history để audit
- Support order notes từ buyer và seller
- Gửi email/SMS notification khi order status thay đổi
- Support order search và filter
- Cache order stats để tăng performance

