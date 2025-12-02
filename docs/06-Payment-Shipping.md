# Payment & Shipping API Documentation

## Tổng quan
Quản lý thanh toán và vận chuyển cho đơn hàng.

## Payment Endpoints

### 1. Tạo payment request
**POST** `/api/payments`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "orderId": "uuid (required)",
  "method": "momo" | "zalopay" | "stripe" | "paypal" | "bank_transfer",
  "amount": 1000000,
  "currency": "VND"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "redirectUrl": "string (nếu cần redirect)",
    "qrCode": "string (nếu là QR code)",
    "status": "pending"
  }
}
```

**Logic:**
- Validate order tồn tại và thuộc về buyer
- Validate amount khớp với order total
- Tạo payment transaction
- Nếu là third-party payment, tạo payment link
- Nếu là bank transfer, tạo QR code hoặc thông tin chuyển khoản

---

### 2. Xác nhận thanh toán (Webhook)
**POST** `/api/payments/webhook/{provider}`

**Request Body:** (Tùy theo provider)

**Response:**
```json
{
  "success": true
}
```

**Logic:**
- Verify webhook signature từ provider
- Update payment status
- Update order payment status
- Gửi notification cho buyer và seller

---

### 3. Kiểm tra trạng thái thanh toán
**GET** `/api/payments/{transactionId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "orderId": "uuid",
    "status": "pending" | "completed" | "failed" | "refunded",
    "amount": 1000000,
    "method": "momo",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

---

### 4. Hoàn tiền
**POST** `/api/payments/{transactionId}/refund`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "amount": 1000000,
  "reason": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refundId": "uuid",
    "status": "pending"
  }
}
```

**Logic:**
- Chỉ seller hoặc admin mới được refund
- Validate amount <= original payment
- Tạo refund transaction
- Update order status = "refunded"
- Process refund qua payment provider

---

## Shipping Endpoints

### 1. Lấy thông tin vận chuyển
**GET** `/api/shipping/{orderId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "trackingNumber": "string",
    "carrier": "string",
    "status": "pending" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered",
    "currentLocation": "string",
    "estimatedDelivery": "ISO8601",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

---

### 2. Lấy lịch sử vận chuyển
**GET** `/api/shipping/{orderId}/history`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "status": "string",
      "location": "string",
      "timestamp": "ISO8601",
      "description": "string",
      "carrier": "string"
    }
  ]
}
```

---

### 3. Cập nhật trạng thái vận chuyển
**PATCH** `/api/shipping/{orderId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "status": "picked_up" | "in_transit" | "out_for_delivery" | "delivered",
  "location": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated ShippingInfo object */
  }
}
```

**Logic:**
- Chỉ seller hoặc admin mới được update
- Tạo shipping history record
- Nếu status = "delivered", update order status = "completed"
- Gửi notification cho buyer

---

### 4. Track package theo tracking number
**GET** `/api/shipping/track/{trackingNumber}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* ShippingInfo object */
  }
}
```

**Logic:**
- Tìm shipping theo tracking number
- Có thể integrate với carrier API để lấy real-time tracking

---

## Database Schema

### Table: Transactions
```sql
- id: uuid (PK)
- user_id: uuid (FK -> Users.id, not null)
- type: transaction_type (not null)
- amount: decimal (not null)
- currency: text (default: 'VND')
- status: text ('pending' | 'completed' | 'failed')
- payment_method: payment_method
- reference: text
- description: text
- order_id: uuid (FK -> Orders.id)
- boost_id: uuid (FK -> ProductBoosts.id)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: UserBalance
```sql
- id: autoincrement (PK)
- user_id: uuid (unique, FK -> Users.id, not null)
- balance: decimal (default: 0)
- updated_at: int64 (not null)
```

### Table: Shipping
```sql
- id: uuid (PK)
- order_id: uuid (unique, FK -> Orders.id, not null)
- tracking_number: text (unique)
- carrier: text
- status: text
- current_location: text
- estimated_delivery: int64
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: ShippingHistory
```sql
- id: autoincrement (PK)
- shipping_id: uuid (FK -> Shipping.id, not null)
- status: text (not null)
- location: text
- description: text
- timestamp: int64 (not null)
```

## Enums

### TransactionType
- `deposit`: Nạp tiền
- `sale`: Bán hàng
- `refund`: Hoàn tiền
- `commission`: Hoa hồng
- `bonus`: Thưởng
- `boost`: Chi phí boost

### PaymentMethod
- `momo`: Ví MoMo
- `zalopay`: ZaloPay
- `stripe`: Stripe
- `paypal`: PayPal
- `bank_transfer`: Chuyển khoản ngân hàng

## Business Logic

### Payment

1. **Payment Methods**:
   - **Third-party (MoMo, ZaloPay, Stripe, PayPal)**: 
     - Tạo payment link qua provider API
     - Redirect user đến payment page
     - Webhook để nhận kết quả
   - **Bank Transfer**:
     - Hiển thị thông tin tài khoản
     - Tạo QR code
     - Manual verification (seller/admin xác nhận)

2. **Payment Flow**:
   - Buyer tạo order → Payment pending
   - Buyer thanh toán → Payment processing
   - Provider confirm → Payment completed → Order confirmed
   - Hoặc manual confirm (bank transfer)

3. **Refund Flow**:
   - Seller/Admin tạo refund request
   - Process refund qua provider
   - Update order status = "refunded"
   - Release stock

4. **User Balance** (nếu có hệ thống ví):
   - Nạp tiền vào ví
   - Thanh toán từ ví
   - Rút tiền từ ví
   - Track tất cả transactions

### Shipping

1. **Shipping Status Flow**:
   - pending → picked_up (seller giao cho carrier)
   - picked_up → in_transit (đang vận chuyển)
   - in_transit → out_for_delivery (sắp giao)
   - out_for_delivery → delivered (đã giao)

2. **Tracking**:
   - Tạo tracking number khi tạo shipping
   - Update status theo thời gian thực
   - Lưu lịch sử mỗi lần update
   - Có thể integrate với carrier API

3. **Self-pickup** (Tự đến lấy):
   - Không cần shipping
   - Order status: ready_for_pickup → completed

4. **Estimated Delivery**:
   - Tính dựa trên khoảng cách và carrier
   - Update khi có thông tin mới

## Integration

### Payment Providers

1. **MoMo**:
   - API: https://developers.momo.vn/
   - Webhook endpoint: `/api/payments/webhook/momo`
   - Verify signature

2. **ZaloPay**:
   - API: https://developers.zalopay.vn/
   - Webhook endpoint: `/api/payments/webhook/zalopay`

3. **Stripe**:
   - API: https://stripe.com/docs/api
   - Webhook endpoint: `/api/payments/webhook/stripe`

4. **PayPal**:
   - API: https://developer.paypal.com/
   - Webhook endpoint: `/api/payments/webhook/paypal`

### Shipping Carriers

1. **Viettel Post**:
   - API integration để tracking
   - Auto-update shipping status

2. **GHN (Giao Hàng Nhanh)**:
   - API integration
   - Create shipping order

3. **GHTK (Giao Hàng Tiết Kiệm)**:
   - API integration

## Permissions

- **Create payment**: Buyer (own order)
- **View payment**: Owner or Admin
- **Process refund**: Seller (own store) or Admin
- **View shipping**: Buyer (own order), Seller (own store), Admin
- **Update shipping**: Seller (own store) or Admin
- **Track package**: Public (nếu có tracking number)

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Payment/Shipping not found
- `409`: Conflict (payment already processed)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Secure webhook endpoints với signature verification
- Support multiple payment methods
- Handle payment failures và retries
- Log tất cả payment transactions
- Support partial refunds
- Auto-update shipping status nếu có carrier API
- Support self-pickup (không cần shipping)
- Calculate shipping cost dựa trên weight, distance
- Support shipping insurance
- Track shipping performance metrics

