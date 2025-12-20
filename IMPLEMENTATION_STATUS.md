# API Implementation Status

## ✅ Completed

### 1. Stores API Module
- ✅ Domain entities
- ✅ Repository interface and implementation
- ✅ DTOs (Create, Update, Query)
- ✅ Service with all business logic
- ✅ Controller with all endpoints
- ✅ Module registration
- ✅ Error codes and messages

**Endpoints implemented:**
- GET `/stores` - List stores
- GET `/stores/search` - Search stores
- GET `/stores/:id` - Get store by ID
- GET `/stores/my` - Get my store
- POST `/stores` - Create store
- PUT `/stores/:id` - Update store
- DELETE `/stores/:id` - Delete store
- GET `/stores/stats` - Get all store statistics
- GET `/stores/stats/my` - Get my store statistics
- GET `/stores/stats/:storeId` - Get store statistics by ID

## 🔴 In Progress / To Do

### 2. Reviews API Module (High Priority)
**Status:** Needs full implementation

**Required files:**
- `src/modules/review/domain/entities/review.entity.ts`
- `src/modules/review/domain/repositories/review.repository.interface.ts`
- `src/modules/review/infrastructure/repositories/review.repository.ts`
- `src/modules/review/application/dto/create-review.dto.ts`
- `src/modules/review/application/dto/update-review.dto.ts`
- `src/modules/review/application/dto/query-review.dto.ts`
- `src/modules/review/application/services/review.service.ts`
- `src/modules/review/interfaces/controllers/review.controller.ts`
- `src/modules/review/review.module.ts`

**Endpoints needed:**
- POST `/reviews` - Create review
- GET `/reviews` - List reviews
- GET `/reviews/:id` - Get review by ID
- GET `/reviews/product/:productId` - Get product reviews
- GET `/reviews/my` - Get user reviews
- GET `/reviews/store/:storeId` - Get store reviews
- PUT `/reviews/:id` - Update review
- DELETE `/reviews/:id` - Delete review
- POST `/reviews/:id/helpful` - Mark helpful
- DELETE `/reviews/:id/helpful` - Unmark helpful
- GET `/reviews/stats` - Get review statistics
- GET `/reviews/stats/product/:productId` - Get product review stats
- GET `/reviews/stats/store/:storeId` - Get store review stats
- GET `/reviews/stats/my` - Get user review stats

### 3. Addresses API Module (High Priority)
**Status:** Needs full implementation

**Required files:**
- `src/modules/address/domain/entities/address.entity.ts`
- `src/modules/address/domain/repositories/address.repository.interface.ts`
- `src/modules/address/infrastructure/repositories/address.repository.ts`
- `src/modules/address/application/dto/create-address.dto.ts`
- `src/modules/address/application/dto/update-address.dto.ts`
- `src/modules/address/application/services/address.service.ts`
- `src/modules/address/interfaces/controllers/address.controller.ts`
- `src/modules/address/address.module.ts`

**Endpoints needed:**
- GET `/addresses` - Get all user addresses
- GET `/addresses/:id` - Get address by ID
- GET `/addresses/default` - Get default address
- POST `/addresses` - Create address
- PUT `/addresses/:id` - Update address
- DELETE `/addresses/:id` - Delete address
- PATCH `/addresses/:id/set-default` - Set default address

### 4. Shipping API Module (High Priority)
**Status:** Needs full implementation

**Required files:**
- `src/modules/shipping/domain/entities/shipping.entity.ts`
- `src/modules/shipping/domain/repositories/shipping.repository.interface.ts`
- `src/modules/shipping/infrastructure/repositories/shipping.repository.ts`
- `src/modules/shipping/application/dto/update-shipping-status.dto.ts`
- `src/modules/shipping/application/services/shipping.service.ts`
- `src/modules/shipping/interfaces/controllers/shipping.controller.ts`
- `src/modules/shipping/shipping.module.ts`

**Endpoints needed:**
- GET `/shipping/:orderId` - Get shipping info
- GET `/shipping/:orderId/history` - Get shipping history
- PATCH `/shipping/:orderId` - Update shipping status
- GET `/shipping/track/:trackingNumber` - Track package

### 5. Product Endpoints (Add to existing Product module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- GET `/products/search` - Search products (query parameter based)
- GET `/products/featured` - Get featured products
- GET `/products/:id/stats` - Get product statistics
- POST `/products/:id/views` - Increment product views
- PATCH `/products/:id/status` - Update product status
- PATCH `/products/:id/stock` - Update product stock
- PATCH `/products/bulk` - Bulk update products
- GET `/seller/products` - Get seller's products
- GET `/categories/:id/products` - Get products by category (in Category controller)
- GET `/stores/:id/products` - Get products by store (in Store controller)

### 6. Category Endpoints (Add to existing Category module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- GET `/categories/:id/subcategories` - Get subcategories
- GET `/categories/:id/stats` - Get category statistics

### 7. Order Endpoints (Add to existing Order module)
**Status:** Needs endpoint additions and field updates

**Endpoints to add:**
- GET `/orders/my` - Get user orders (verify exists)
- GET `/orders/store/:storeId` - Get store orders
- PATCH `/orders/:id/status` - Update order status
- PATCH `/orders/:id/confirm` - Confirm order
- PATCH `/orders/:id/payment-status` - Update payment status
- GET `/orders/stats` - Get order statistics
- GET `/orders/stats/store/:storeId` - Get store order stats
- GET `/orders/stats/my` - Get user order stats
- PUT `/orders/:id` - Update order (verify exists)

**Field updates needed:**
- Ensure response includes all fields expected by frontend
- Add `storeName`, `storeLogo`, `userEmail`, `userName` to response
- Format `items` array correctly

### 8. Cart Endpoints (Add to existing Cart module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- GET `/cart/stats` - Get cart statistics
- DELETE `/cart` - Clear cart (verify if `/cart/clear` should also work)

### 9. Chat Endpoints (Add to existing Chat module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- GET `/chat/messages/:id` - Get message by ID
- POST `/chat/messages` - Create message (alternative)
- DELETE `/chat/messages/:id` - Delete message
- POST `/chat/conversations/:id/participants/:userId` - Add participant
- DELETE `/chat/conversations/:id/participants/:userId` - Remove participant
- POST `/chat/conversations/:id/messages/:messageId/read` - Mark message as read
- PUT `/chat/conversations/:id` - Update conversation
- DELETE `/chat/conversations/:id` - Delete conversation
- GET `/chat/stats` - Get chat statistics

### 10. Upload Endpoints (Add to existing Upload module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- POST `/upload/product-images` - Upload product images
- POST `/upload/store-image` - Upload store image (logo/banner)
- POST `/upload/avatar` - Upload avatar
- GET `/upload/files/:fileId` - Get file info
- GET `/upload/files` - List user files

### 11. Auth Endpoints (Add to existing Auth module)
**Status:** Needs endpoint additions

**Endpoints to add:**
- POST `/auth/google` - Google OAuth
- POST `/auth/facebook` - Facebook OAuth

## Implementation Notes

1. **Response Format:** All APIs should return data in format:
   ```typescript
   {
     success: boolean,
     data: T,
     message?: string
   }
   ```

2. **Field Mapping:** 
   - Store contact/address info stored in JSON fields need to be flattened in responses
   - IDs should be converted to strings for frontend compatibility
   - Dates should be ISO strings

3. **Pagination:** Use `page` and `pageSize` query parameters, return:
   ```typescript
   {
     items: T[],
     total: number,
     page: number,
     pageSize: number,
     totalPages: number
   }
   ```

4. **Error Handling:** Use consistent error format with error codes from constants

5. **Validation:** All DTOs should have proper validation decorators

6. **Swagger:** All endpoints should have proper Swagger documentation


