# Chogiare Admin Seller - Backend API Documentation

## Tổng quan
Đây là bộ tài liệu đầy đủ về các API endpoints và business logic cho hệ thống Chogiare Admin Seller Platform. Tài liệu được tạo từ codebase frontend để team backend có thể implement các API tương ứng.

## Cấu trúc tài liệu

1. **[01-Authentication-Authorization.md](./01-Authentication-Authorization.md)**
   - Đăng nhập, đăng ký, logout
   - Token management và refresh
   - Password reset
   - OAuth (Google, Facebook)

2. **[02-User-Management.md](./02-User-Management.md)**
   - Quản lý users
   - Profile management
   - User statistics

3. **[03-Product-Category-Management.md](./03-Product-Category-Management.md)**
   - Product CRUD operations
   - Product search và filtering
   - Category management
   - Product statistics

4. **[04-Store-Management.md](./04-Store-Management.md)**
   - Store CRUD operations
   - Store verification
   - Store statistics

5. **[05-Cart-Order-Management.md](./05-Cart-Order-Management.md)**
   - Cart management
   - Order creation và management
   - Order status flow
   - Stock reservation

6. **[06-Payment-Shipping.md](./06-Payment-Shipping.md)**
   - Payment processing
   - Payment methods integration
   - Shipping tracking
   - Refunds

7. **[07-Review-Chat-System.md](./07-Review-Chat-System.md)**
   - Review và rating system
   - Chat và messaging
   - Real-time communication

8. **[08-Inventory-Stock-Management.md](./08-Inventory-Stock-Management.md)**
   - Stock management
   - Stock in/out operations
   - Stock alerts
   - Inventory reports

9. **[09-Boost-Promotion-System.md](./09-Boost-Promotion-System.md)**
   - Boost packages
   - Boost purchase
   - Boost effects và expiration

10. **[10-Admin-Features.md](./10-Admin-Features.md)**
    - Admin dashboard
    - User management
    - Product moderation
    - Reports & Analytics
    - System settings

11. **[11-File-Upload-Notifications.md](./11-File-Upload-Notifications.md)**
    - File upload (images, documents)
    - Notification system
    - Real-time notifications

12. **[12-API-Structure-Overview.md](./12-API-Structure-Overview.md)**
    - API structure tổng quan
    - Authentication
    - Error handling
    - Best practices

## Database Schema

Xem file `database_schema.dbml` trong root directory để biết chi tiết về database schema.

## Quick Start

### 1. Authentication Flow
```
1. User đăng ký/đăng nhập
2. Nhận access token và refresh token
3. Sử dụng access token cho các API calls
4. Refresh token khi access token hết hạn
```

### 2. Order Flow
```
1. Buyer thêm products vào cart
2. Buyer checkout → tạo order
3. Reserve stock cho order
4. Seller confirm order
5. Buyer thanh toán
6. Seller chuẩn bị hàng → ready_for_pickup
7. Buyer nhận hàng → completed
8. Release stock và cho phép review
```

### 3. Product Flow
```
1. Seller tạo product (status: draft)
2. Admin approve → status: active
3. Product hiển thị trên marketplace
4. Buyer có thể mua
5. Khi có order, reserve stock
6. Khi order completed, trừ stock
```

## Key Features

### 1. Multi-role System
- **Buyer**: Mua hàng, đánh giá, chat
- **Seller**: Bán hàng, quản lý store, inventory
- **Admin**: Quản trị hệ thống

### 2. Product Management
- Product CRUD với moderation
- Category hierarchy
- Stock management
- Product search và filtering

### 3. Order Management
- Cart system
- Order creation với stock reservation
- Order status flow
- Payment integration

### 4. Boost/Promotion
- Pay per view
- Pay per day
- Featured slot
- Boost to category

### 5. Inventory Management
- Stock in/out
- Stock alerts
- Inventory reports
- Profit calculation

### 6. Communication
- Real-time chat
- Review và rating
- Notifications

## Technology Stack Recommendations

### Backend
- **Language**: Go, Node.js, Python, Java
- **Framework**: Gin (Go), Express (Node.js), FastAPI (Python), Spring Boot (Java)
- **Database**: PostgreSQL hoặc MySQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ hoặc Kafka
- **File Storage**: AWS S3, Cloudinary, hoặc local storage

### Authentication
- JWT tokens
- Refresh token rotation
- OAuth 2.0

### Real-time
- WebSocket (Socket.io, Gorilla WebSocket)
- Server-Sent Events (SSE)
- Pusher hoặc Firebase

### Payment Integration
- MoMo API
- ZaloPay API
- Stripe API
- PayPal API

## Important Notes

1. **Security**:
   - Validate tất cả inputs
   - Sanitize outputs
   - Use HTTPS
   - Implement rate limiting
   - Protect against SQL injection, XSS, CSRF

2. **Performance**:
   - Use database indexes
   - Implement caching
   - Optimize queries
   - Use pagination
   - CDN cho static files

3. **Scalability**:
   - Design for horizontal scaling
   - Use load balancer
   - Database replication
   - Microservices architecture (nếu cần)

4. **Monitoring**:
   - Log all requests
   - Track errors
   - Monitor performance
   - Set up alerts

5. **Testing**:
   - Unit tests
   - Integration tests
   - API tests
   - Load tests

## Contact

Nếu có câu hỏi hoặc cần clarification, vui lòng liên hệ team frontend.

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

