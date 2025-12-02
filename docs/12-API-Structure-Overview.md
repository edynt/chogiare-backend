# API Structure Overview

## Tổng quan
Tài liệu tổng quan về cấu trúc API, authentication, error handling, và best practices.

## Base URL
```
Production: https://api.chogiare.com/api
Development: http://localhost:8080/api
```

## Authentication

### Token-based Authentication
Tất cả protected endpoints yêu cầu Bearer token trong header:
```
Authorization: Bearer {accessToken}
```

### Token Refresh
- Access token có thời hạn ngắn (15 phút - 1 giờ)
- Refresh token có thời hạn dài (7-30 ngày)
- Auto-refresh token khi access token hết hạn
- Concurrency-safe token refresh (tránh race condition)

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    /* Response data */
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field1": ["Error message 1", "Error message 2"],
    "field2": ["Error message"]
  },
  "code": "ERROR_CODE"
}
```

## Pagination

Tất cả list endpoints hỗ trợ pagination:

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10, max: 100)

**Response:**
```json
{
  "items": [/* Array of items */],
  "total": 1000,
  "page": 1,
  "pageSize": 10,
  "totalPages": 100
}
```

## Sorting

**Query Parameters:**
- `sortBy`: string (field name)
- `sortOrder`: "asc" | "desc" (default: "desc")

**Example:**
```
GET /api/products?sortBy=createdAt&sortOrder=desc
```

## Filtering

**Query Parameters:**
- Tùy theo endpoint, có các filter khác nhau
- Support multiple filters cùng lúc

**Example:**
```
GET /api/products?categoryId=123&minPrice=100000&maxPrice=1000000&status=active
```

## Search

**Query Parameters:**
- `query`: string (search text)
- `search`: string (alternative)

**Example:**
```
GET /api/products/search?query=iphone&categoryId=123
```

## Error Codes

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error, invalid input)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate, already exists)
- `422`: Unprocessable Entity (validation error)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

### Custom Error Codes
- `VALIDATION_ERROR`: Validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Duplicate resource
- `INSUFFICIENT_STOCK`: Stock not enough
- `PAYMENT_FAILED`: Payment processing failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

- **Public endpoints**: 100 requests/minute per IP
- **Authenticated endpoints**: 1000 requests/minute per user
- **Upload endpoints**: 10 requests/minute per user
- **Admin endpoints**: 5000 requests/minute per admin

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## CORS

- **Allowed Origins**: Configured per environment
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Supported

## API Versioning

Hiện tại sử dụng URL versioning:
```
/api/v1/products
/api/v2/products
```

Hoặc header versioning:
```
Accept: application/vnd.chogiare.v1+json
```

## Data Formats

### Dates
- Format: ISO 8601
- Example: `2024-01-15T10:30:00Z`
- Timezone: UTC

### Currency
- Format: Number (không có dấu phẩy)
- Example: `1000000` (1,000,000 VND)
- Currency code: VND (default)

### UUIDs
- Format: UUID v4
- Example: `550e8400-e29b-41d4-a716-446655440000`

## File Upload

### Supported Formats
- **Images**: jpg, jpeg, png, gif, webp
- **Documents**: pdf, doc, docx, xls, xlsx

### Size Limits
- **Images**: Max 10MB
- **Documents**: Max 50MB

### Upload Progress
Support upload progress tracking qua `onUploadProgress` callback.

## Webhooks

### Supported Events
- `order.created`
- `order.updated`
- `order.completed`
- `payment.completed`
- `payment.failed`
- `product.approved`
- `product.rejected`

### Webhook Format
```json
{
  "event": "order.created",
  "timestamp": "ISO8601",
  "data": {
    /* Event data */
  },
  "signature": "hmac_signature"
}
```

### Signature Verification
Verify webhook signature với secret key:
```
HMAC-SHA256(payload, secret_key)
```

## Real-time Updates

### WebSocket
- Endpoint: `wss://api.chogiare.com/ws`
- Authentication: Bearer token trong query string
- Events: notifications, chat messages, order updates

### Server-Sent Events (SSE)
- Endpoint: `/api/events`
- Authentication: Bearer token trong header
- Events: notifications, order updates

## API Modules

### 1. Authentication (`/api/auth/*`)
- Login, Register, Logout
- Token refresh
- Password reset
- OAuth (Google, Facebook)

### 2. Users (`/api/users/*`)
- User management
- Profile management
- User stats

### 3. Products (`/api/products/*`)
- Product CRUD
- Product search
- Product stats

### 4. Categories (`/api/categories/*`)
- Category CRUD
- Category hierarchy

### 5. Stores (`/api/stores/*`)
- Store CRUD
- Store search
- Store stats

### 6. Cart (`/api/cart/*`)
- Cart management
- Cart items

### 7. Orders (`/api/orders/*`)
- Order CRUD
- Order status management
- Order stats

### 8. Payments (`/api/payments/*`)
- Payment processing
- Payment status
- Refunds

### 9. Shipping (`/api/shipping/*`)
- Shipping tracking
- Shipping history

### 10. Reviews (`/api/reviews/*`)
- Review CRUD
- Review stats

### 11. Chat (`/api/chat/*`)
- Conversations
- Messages

### 12. Addresses (`/api/addresses/*`)
- Address CRUD
- Default address

### 13. Inventory (`/api/inventory/*`)
- Stock management
- Stock in/out
- Stock alerts

### 14. Boost (`/api/boost/*`)
- Boost packages
- Boost purchase
- Boost management

### 15. Upload (`/api/upload/*`)
- File upload
- File management

### 16. Notifications (`/api/notifications/*`)
- Notification list
- Notification read status

### 17. Admin (`/api/admin/*`)
- User management
- Product moderation
- Order management
- Reports & Analytics
- System settings

## Best Practices

1. **Idempotency**: POST requests nên support idempotency key
2. **Caching**: Cache responses khi có thể (products, categories)
3. **Compression**: Enable gzip compression
4. **Logging**: Log tất cả requests và errors
5. **Monitoring**: Monitor API performance và errors
6. **Documentation**: Keep API documentation up-to-date
7. **Versioning**: Support API versioning
8. **Security**: Validate input, sanitize output
9. **Performance**: Optimize queries, use indexes
10. **Testing**: Comprehensive test coverage

## Testing

### Test Environment
- Base URL: `http://localhost:8080/api`
- Test data: Seeded automatically
- Test users: Pre-configured

### Test Credentials
```
Admin:
  email: admin@chogiare.com
  password: admin123

Seller:
  email: seller@chogiare.com
  password: seller123

Buyer:
  email: buyer@chogiare.com
  password: buyer123
```

## SDKs & Libraries

### JavaScript/TypeScript
```javascript
import { apiClient } from '@chogiare/sdk'

const products = await apiClient.products.getProducts()
```

### Python
```python
from chogiare import Client

client = Client(api_key='your_api_key')
products = client.products.list()
```

## Support

- **Documentation**: https://docs.chogiare.com
- **Support Email**: support@chogiare.com
- **Status Page**: https://status.chogiare.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Core features: Auth, Products, Orders, Payments

### v1.1.0 (2024-02-01)
- Added Chat system
- Added Boost/Promotion system
- Added Inventory management

## Migration Guide

### From v1.0 to v1.1
- No breaking changes
- New endpoints added
- New fields added to existing responses (backward compatible)

