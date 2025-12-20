# Missing APIs Summary

This document lists all APIs that are expected by the frontend but missing or incomplete in the backend.

## ✅ Completed
1. **Stores API** - Fully implemented

## 🔴 Missing APIs (Need Implementation)

### 1. Reviews API (Completely Missing)
- POST `/reviews` - Create review
- GET `/reviews` - List all reviews
- GET `/reviews/:id` - Get review by ID
- GET `/reviews/product/:productId` - Get product reviews
- GET `/reviews/my` - Get user reviews
- GET `/reviews/store/:storeId` - Get store reviews
- PUT `/reviews/:id` - Update review
- DELETE `/reviews/:id` - Delete review
- POST `/reviews/:id/helpful` - Mark review as helpful
- DELETE `/reviews/:id/helpful` - Unmark review as helpful
- GET `/reviews/stats` - Get review statistics
- GET `/reviews/stats/product/:productId` - Get product review stats
- GET `/reviews/stats/store/:storeId` - Get store review stats
- GET `/reviews/stats/my` - Get user review stats

### 2. Addresses API (Completely Missing)
- GET `/addresses` - Get all user addresses
- GET `/addresses/:id` - Get address by ID
- GET `/addresses/default` - Get default address
- POST `/addresses` - Create address
- PUT `/addresses/:id` - Update address
- DELETE `/addresses/:id` - Delete address
- PATCH `/addresses/:id/set-default` - Set default address

### 3. Shipping API (Completely Missing)
- GET `/shipping/:orderId` - Get shipping info
- GET `/shipping/:orderId/history` - Get shipping history
- PATCH `/shipping/:orderId` - Update shipping status
- GET `/shipping/track/:trackingNumber` - Track package

### 4. Product Endpoints (Missing from existing Product API)
- GET `/products/search` - Search products
- GET `/products/featured` - Get featured products
- GET `/products/:id/stats` - Get product statistics
- POST `/products/:id/views` - Increment product views
- PATCH `/products/:id/status` - Update product status
- PATCH `/products/:id/stock` - Update product stock
- PATCH `/products/bulk` - Bulk update products
- GET `/seller/products` - Get seller's products
- GET `/categories/:id/products` - Get products by category
- GET `/stores/:id/products` - Get products by store

### 5. Category Endpoints (Missing from existing Category API)
- GET `/categories/:id/subcategories` - Get subcategories
- GET `/categories/:id/stats` - Get category statistics

### 6. Order Endpoints (Missing from existing Order API)
- GET `/orders/my` - Get user orders (exists but may need field updates)
- GET `/orders/store/:storeId` - Get store orders
- PATCH `/orders/:id/status` - Update order status
- PATCH `/orders/:id/confirm` - Confirm order
- PATCH `/orders/:id/payment-status` - Update payment status
- GET `/orders/stats` - Get order statistics
- GET `/orders/stats/store/:storeId` - Get store order stats
- GET `/orders/stats/my` - Get user order stats
- PUT `/orders/:id` - Update order (may need field updates)

### 7. Cart Endpoints (Missing from existing Cart API)
- GET `/cart/stats` - Get cart statistics
- DELETE `/cart` - Clear cart (exists as DELETE `/cart/clear`)

### 8. Chat Endpoints (Missing from existing Chat API)
- GET `/chat/messages/:id` - Get message by ID
- POST `/chat/messages` - Create message (alternative endpoint)
- DELETE `/chat/messages/:id` - Delete message
- POST `/chat/conversations/:id/participants/:userId` - Add participant
- DELETE `/chat/conversations/:id/participants/:userId` - Remove participant
- POST `/chat/conversations/:id/messages/:messageId/read` - Mark message as read
- PUT `/chat/conversations/:id` - Update conversation
- DELETE `/chat/conversations/:id` - Delete conversation
- GET `/chat/stats` - Get chat statistics

### 9. Upload Endpoints (Missing from existing Upload API)
- POST `/upload/product-images` - Upload product images
- POST `/upload/store-image` - Upload store image (logo/banner)
- POST `/upload/avatar` - Upload avatar
- GET `/upload/files/:fileId` - Get file info
- GET `/upload/files` - List user files

### 10. Auth Endpoints (Missing from existing Auth API)
- POST `/auth/google` - Google OAuth
- POST `/auth/facebook` - Facebook OAuth

## 📋 Field Mismatches (APIs exist but fields don't match)

### Order Response Fields
Frontend expects:
- `userId` (number)
- `storeId` (string)
- `status` (string)
- `paymentStatus` (string)
- `paymentMethod` (string)
- `subtotal`, `tax`, `shipping`, `discount`, `total` (numbers)
- `shippingAddress`, `billingAddress` (strings)
- `notes` (string)
- `storeName`, `storeLogo` (strings)
- `userEmail`, `userName` (strings)
- `items` (array of OrderItem with: id, orderId, productId, productName, productImage, price, quantity, subtotal)

Backend may need to adjust response format to match.

### Product Response Fields
Frontend expects all fields from Product type. Need to verify backend returns all required fields.

### Review Response Fields
Frontend expects:
- `id`, `productId`, `userId`, `orderId` (strings/numbers)
- `rating` (number)
- `title`, `comment` (strings)
- `images` (string array)
- `isVerified` (boolean)
- `helpful` (number)
- `userName`, `userEmail`, `userAvatar` (strings)
- `productName`, `productImage` (strings)

### Store Response Fields
Frontend expects flat structure with:
- `website`, `phone`, `email`, `address`, `city`, `state`, `country`, `postalCode` as top-level fields
- Backend stores these in JSON fields (`contactInfo`, `addressInfo`)

## Implementation Priority

1. **High Priority** (Core functionality):
   - Reviews API
   - Addresses API
   - Shipping API
   - Missing Product endpoints
   - Missing Order endpoints

2. **Medium Priority** (Enhanced features):
   - Missing Category endpoints
   - Missing Cart endpoints
   - Missing Chat endpoints
   - Missing Upload endpoints

3. **Low Priority** (Nice to have):
   - OAuth endpoints


