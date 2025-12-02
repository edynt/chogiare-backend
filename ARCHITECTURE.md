# Architecture Design - Chogiare Backend

## 1. Kiến trúc tổng thể

Hệ thống được thiết kế theo **Clean Architecture** kết hợp với **Modular Architecture**, đảm bảo:
- Separation of Concerns
- Dependency Inversion
- Testability
- Maintainability
- Scalability

## 2. Layer Architecture

```
┌─────────────────────────────────────────┐
│         Interfaces Layer                │
│  (Controllers, DTOs, Validators)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Application Layer                  │
│  (Use Cases, Services, Application)     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Domain Layer                    │
│  (Entities, Domain Logic, Interfaces)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer               │
│  (Prisma, Redis, Supabase, External)    │
└─────────────────────────────────────────┘
```

### 2.1. Interfaces Layer
- **Controllers**: Handle HTTP requests/responses
- **DTOs**: Data Transfer Objects cho validation
- **Validators**: Input validation logic
- **Exception Filters**: Global error handling
- **Interceptors**: Response transformation

### 2.2. Application Layer
- **Use Cases**: Business logic orchestration
- **Services**: Application services
- **Application Interfaces**: Ports cho domain layer

### 2.3. Domain Layer
- **Entities**: Domain models (business objects)
- **Domain Services**: Domain-specific logic
- **Value Objects**: Immutable value objects
- **Domain Events**: Domain events
- **Repository Interfaces**: Ports (abstractions)

### 2.4. Infrastructure Layer
- **Repositories**: Prisma implementations
- **Cache**: Redis implementations
- **Storage**: Supabase Storage
- **External Services**: Payment, Shipping APIs
- **Database**: Prisma Client

## 3. Module Structure

Mỗi module độc lập, có cấu trúc:

```
modules/
  └── product/
      ├── domain/
      │   ├── entities/
      │   ├── repositories/
      │   └── services/
      ├── application/
      │   ├── use-cases/
      │   ├── services/
      │   └── dto/
      ├── infrastructure/
      │   ├── repositories/
      │   └── adapters/
      └── interfaces/
          ├── controllers/
          ├── dto/
          └── validators/
```

## 4. Technology Stack

### 4.1. Core
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **ORM**: Prisma (latest)
- **Database**: Supabase PostgreSQL
- **Cache**: Redis
- **Queue**: Redis (BullMQ)

### 4.2. Authentication
- **JWT**: Access tokens
- **Supabase Auth**: Optional (có thể dùng thay JWT)
- **Refresh Tokens**: Database storage

### 4.3. Storage
- **Supabase Storage**: Images, files
- **CDN**: Supabase CDN

### 4.4. External Services
- **Payment**: MoMo, ZaloPay, Stripe, PayPal
- **Shipping**: Viettel Post, GHN, GHTK
- **Email**: SendGrid / AWS SES
- **SMS**: Twilio / AWS SNS

### 4.5. Monitoring & Logging
- **Logging**: Pino (structured logging)
- **Monitoring**: Prometheus + Grafana
- **Error Tracking**: Sentry (optional)

## 5. Database Design

### 5.1. Database Choice
- **Primary**: Supabase PostgreSQL
- **Cache**: Redis
- **Queue**: Redis (BullMQ)

### 5.2. Schema Principles
- Normalized design (3NF)
- Proper indexing
- Foreign key constraints
- Unique constraints
- Check constraints
- Soft deletes (where applicable)

### 5.3. Transaction Management
- Use Prisma transactions cho atomic operations
- Isolation levels:
  - **Read Committed**: Default
  - **Serializable**: Cho critical operations (payment, stock)

### 5.4. Indexing Strategy
- Primary keys: Auto-indexed
- Foreign keys: Indexed
- Search fields: Full-text indexes
- Composite indexes: Cho queries phức tạp

## 6. Caching Strategy

### 6.1. Cache Layers
1. **Application Cache**: In-memory (NestJS cache)
2. **Redis Cache**: Distributed cache
3. **CDN Cache**: Static assets

### 6.2. Cache Keys
```
products:{id}
products:list:{filters}
categories:tree
stores:{id}
user:{id}:profile
```

### 6.3. Cache TTL
- **Products**: 1 hour
- **Categories**: 24 hours
- **Stores**: 1 hour
- **User Profile**: 30 minutes
- **Stats**: 5 minutes

### 6.4. Cache Invalidation
- **Write-through**: Update cache khi write
- **Write-behind**: Update cache async
- **Invalidation**: Clear cache khi data thay đổi

## 7. Queue Strategy

### 7.1. Queue Use Cases
- **Stock Updates**: Async stock operations
- **Notifications**: Send notifications
- **Email/SMS**: Send emails/SMS
- **Reports**: Generate reports
- **Image Processing**: Resize/optimize images

### 7.2. Queue Priority
- **High**: Payment processing, Stock updates
- **Medium**: Notifications, Emails
- **Low**: Reports, Analytics

### 7.3. Retry Strategy
- **Max Retries**: 3
- **Backoff**: Exponential
- **Dead Letter Queue**: Failed jobs

## 8. API Design

### 8.1. REST Principles
- Resource-based URLs
- HTTP methods: GET, POST, PUT, PATCH, DELETE
- Status codes: Proper HTTP status codes
- Versioning: `/v1/...`

### 8.2. Response Format
```json
{
  "status": "success",
  "message": "...",
  "data": <any>,
  "error": null
}
```

### 8.3. Error Format
```json
{
  "status": "error",
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  },
  "data": null
}
```

### 8.4. Pagination
```json
{
  "items": [],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10
}
```

## 9. Security Architecture

### 9.1. Authentication Flow
```
1. User login → JWT access token + refresh token
2. Access token: Short-lived (15 min - 1 hour)
3. Refresh token: Long-lived (7-30 days)
4. Token refresh: Use refresh token to get new access token
```

### 9.2. Authorization
- **RBAC**: Role-Based Access Control
- **Guards**: NestJS guards cho route protection
- **Decorators**: Custom decorators cho permissions

### 9.3. Data Protection
- **Encryption**: Sensitive data encrypted
- **Hashing**: Passwords hashed (bcrypt/argon2)
- **HTTPS**: All communications encrypted
- **CORS**: Configured properly

## 10. Error Handling

### 10.1. Error Types
- **Domain Errors**: Business logic errors
- **Application Errors**: Use case errors
- **Infrastructure Errors**: Database, external services
- **Validation Errors**: Input validation

### 10.2. Error Handling Strategy
- **Global Exception Filter**: Catch all errors
- **Custom Exceptions**: Domain-specific exceptions
- **Error Codes**: Standardized error codes
- **Logging**: Log all errors

## 11. Testing Strategy

### 11.1. Test Types
- **Unit Tests**: Domain logic, services
- **Integration Tests**: API endpoints, database
- **E2E Tests**: Full flow tests
- **Load Tests**: Performance tests

### 11.2. Test Coverage
- **Target**: >80% coverage
- **Critical Paths**: 100% coverage
- **Domain Logic**: 100% coverage

## 12. Deployment Architecture

### 12.1. Environment Setup
- **Development**: Local với Docker Compose
- **Staging**: Cloud environment
- **Production**: Cloud environment với load balancer

### 12.2. Container Strategy
- **Multi-stage Dockerfile**: Optimize image size
- **Docker Compose**: Local development
- **Kubernetes**: Production (optional)

### 12.3. CI/CD Pipeline
```
Code Push → Lint → Test → Build → Deploy
```

## 13. Monitoring & Observability

### 13.1. Logging
- **Structured Logging**: JSON format
- **Log Levels**: Error, Warn, Info, Debug
- **Log Aggregation**: Centralized logging

### 13.2. Metrics
- **Application Metrics**: Response time, error rate
- **Business Metrics**: Orders, revenue
- **Infrastructure Metrics**: CPU, memory, disk

### 13.3. Tracing
- **Request Tracing**: Track request flow
- **Performance Tracing**: Identify bottlenecks

## 14. Scalability Considerations

### 14.1. Horizontal Scaling
- **Stateless Services**: No session state
- **Load Balancer**: Distribute traffic
- **Database Replication**: Read replicas

### 14.2. Vertical Scaling
- **Resource Optimization**: Efficient code
- **Database Optimization**: Indexes, queries
- **Caching**: Reduce database load

### 14.3. Microservices (Future)
- **Service Separation**: Split by domain
- **API Gateway**: Single entry point
- **Service Mesh**: Inter-service communication

## 15. Data Flow

### 15.1. Request Flow
```
Client → Load Balancer → NestJS App → Controller → Use Case → Repository → Database
                                                              ↓
                                                          Cache/Queue
```

### 15.2. Response Flow
```
Database → Repository → Use Case → Controller → Response Formatter → Client
         ↑
      Cache (if hit)
```

## 16. Module Dependencies

```
Core Modules:
  - auth (authentication)
  - user (user management)
  - product (products)
  - category (categories)
  - store (stores)
  - order (orders)
  - cart (shopping cart)
  - payment (payments)
  - shipping (shipping)
  - review (reviews)
  - chat (chat system)
  - inventory (inventory)
  - boost (boost/promotion)
  - notification (notifications)
  - upload (file upload)
  - admin (admin features)

Shared:
  - common (shared utilities)
  - config (configuration)
  - database (Prisma setup)
  - cache (Redis setup)
  - queue (Queue setup)
```

## 17. Best Practices

1. **SOLID Principles**: Apply SOLID throughout
2. **DRY**: Don't Repeat Yourself
3. **KISS**: Keep It Simple, Stupid
4. **YAGNI**: You Aren't Gonna Need It
5. **Clean Code**: Readable, maintainable code
6. **Documentation**: Code comments, API docs
7. **Error Handling**: Comprehensive error handling
8. **Logging**: Log important operations
9. **Testing**: Write tests
10. **Security**: Security first mindset


