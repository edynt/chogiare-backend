# Review & Chat System API Documentation

## Tổng quan
Hệ thống đánh giá sản phẩm và chat giữa buyer và seller.

## Review Endpoints

### 1. Tạo review
**POST** `/api/reviews`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "productId": "uuid (required)",
  "orderId": "uuid (optional)",
  "rating": 1-5 (required),
  "title": "string (optional)",
  "comment": "string (optional)",
  "images": ["url1", "url2"] (optional),
  "isVerified": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "userId": 123,
    "orderId": "uuid",
    "rating": 5,
    "title": "string",
    "comment": "string",
    "images": ["url1"],
    "isVerified": true,
    "helpful": 0,
    "userName": "string",
    "userEmail": "string",
    "userAvatar": "string",
    "productName": "string",
    "productImage": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Chỉ buyer đã mua sản phẩm mới được review (nếu có orderId)
- Validate rating từ 1-5
- Auto-set isVerified = true nếu có orderId
- Update product rating và reviewCount
- Update store rating

---

### 2. Lấy thông tin review
**GET** `/api/reviews/{reviewId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* Review object */
  }
}
```

---

### 3. Lấy danh sách reviews
**GET** `/api/reviews`

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `productId`: uuid
- `userId`: uuid
- `storeId`: uuid
- `rating`: number (1-5)
- `isVerified`: boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      /* Array of Review objects */
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

---

### 4. Lấy reviews của sản phẩm
**GET** `/api/reviews/product/{productId}`

**Query Parameters:** Tương tự GET /reviews

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewListResponse */
  }
}
```

---

### 5. Lấy reviews của user
**GET** `/api/reviews/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:** Tương tự GET /reviews

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewListResponse */
  }
}
```

---

### 6. Lấy reviews của store
**GET** `/api/reviews/store/{storeId}`

**Query Parameters:** Tương tự GET /reviews

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewListResponse */
  }
}
```

---

### 7. Cập nhật review
**PUT** `/api/reviews/{reviewId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "rating": 5,
  "title": "string",
  "comment": "string",
  "images": ["url1"],
  "isVerified": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Review object */
  }
}
```

**Logic:**
- Chỉ owner của review mới được update
- Update product rating nếu rating thay đổi
- Có thể giới hạn thời gian edit (ví dụ: 7 ngày)

---

### 8. Xóa review
**DELETE** `/api/reviews/{reviewId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

**Logic:**
- Chỉ owner hoặc admin mới được xóa
- Update product rating và reviewCount
- Update store rating

---

### 9. Đánh dấu review hữu ích
**POST** `/api/reviews/{reviewId}/helpful`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Marked as helpful"
}
```

**Logic:**
- Tăng helpful count
- Mỗi user chỉ đánh dấu 1 lần
- Lưu vào bảng ReviewHelpful

---

### 10. Bỏ đánh dấu review hữu ích
**DELETE** `/api/reviews/{reviewId}/helpful`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Unmarked as helpful"
}
```

---

### 11. Lấy thống kê reviews
**GET** `/api/reviews/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReviews": 1000,
    "averageRating": 4.5,
    "ratingCounts": {
      "1": 10,
      "2": 20,
      "3": 50,
      "4": 200,
      "5": 720
    },
    "verifiedReviews": 800
  }
}
```

---

### 12. Lấy thống kê reviews của sản phẩm
**GET** `/api/reviews/stats/product/{productId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewStats object */
  }
}
```

---

### 13. Lấy thống kê reviews của store
**GET** `/api/reviews/stats/store/{storeId}`

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewStats object */
  }
}
```

---

### 14. Lấy thống kê reviews của user
**GET** `/api/reviews/stats/my`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* ReviewStats object */
  }
}
```

---

## Chat Endpoints

### 1. Tạo conversation
**POST** `/api/chat/conversations`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "type": "direct" | "group",
  "title": "string (optional, cho group)",
  "userIds": [123, 456] (required)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "direct",
    "title": "string",
    "participants": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "userId": 123,
        "role": "string",
        "joinedAt": "ISO8601"
      }
    ],
    "lastMessage": {
      /* ChatMessage object */
    },
    "unreadCount": 0,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Tự động thêm authenticated user vào participants
- Nếu type = "direct" và đã có conversation với user đó, trả về conversation cũ
- Tạo conversation mới nếu chưa có

---

### 2. Lấy thông tin conversation
**GET** `/api/chat/conversations/{conversationId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Conversation object */
  }
}
```

**Logic:**
- Chỉ participants mới được xem

---

### 3. Lấy danh sách conversations
**GET** `/api/chat/conversations`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      /* Array of Conversation objects */
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

**Logic:**
- Chỉ trả về conversations mà user là participant
- Sort by updatedAt desc (conversation mới nhất trước)
- Include lastMessage và unreadCount

---

### 4. Cập nhật conversation
**PUT** `/api/chat/conversations/{conversationId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "type": "direct" | "group",
  "title": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* Updated Conversation object */
  }
}
```

---

### 5. Xóa conversation
**DELETE** `/api/chat/conversations/{conversationId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**Logic:**
- Soft delete (chỉ xóa khỏi danh sách của user)
- Hoặc hard delete nếu tất cả participants xóa

---

### 6. Thêm participant (Group only)
**POST** `/api/chat/conversations/{conversationId}/participants/{userId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    /* ConversationParticipant object */
  }
}
```

---

### 7. Xóa participant (Group only)
**DELETE** `/api/chat/conversations/{conversationId}/participants/{userId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Participant removed"
}
```

---

### 8. Gửi message
**POST** `/api/chat/conversations/{conversationId}/messages`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request Body:**
```json
{
  "messageType": "text" | "image" | "file",
  "content": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderId": 123,
    "messageType": "text",
    "content": "string",
    "isRead": false,
    "senderName": "string",
    "senderEmail": "string",
    "senderAvatar": "string",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Logic:**
- Validate user là participant
- Tạo message
- Update conversation updatedAt
- Update lastMessage
- Gửi real-time notification (WebSocket/Pusher)
- Mark unread cho các participants khác

---

### 9. Lấy messages của conversation
**GET** `/api/chat/conversations/{conversationId}/messages`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page`: number (default: 1)
- `pageSize`: number (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      /* Array of ChatMessage objects */
    ],
    "total": 100,
    "page": 1,
    "pageSize": 50,
    "totalPages": 2
  }
}
```

**Logic:**
- Sort by createdAt desc (mới nhất trước)
- Pagination
- Mark messages as read khi user xem

---

### 10. Đánh dấu message đã đọc
**POST** `/api/chat/conversations/{conversationId}/messages/{messageId}/read`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

---

### 11. Đánh dấu conversation đã đọc
**POST** `/api/chat/conversations/{conversationId}/read`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

**Logic:**
- Mark tất cả messages trong conversation là đã đọc
- Reset unreadCount = 0

---

### 12. Xóa message
**DELETE** `/api/chat/conversations/{conversationId}/messages/{messageId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Logic:**
- Chỉ sender mới được xóa
- Soft delete hoặc hard delete
- Có thể support "delete for everyone" trong thời gian nhất định

---

### 13. Lấy thống kê chat
**GET** `/api/chat/stats`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConversations": 10,
    "totalMessages": 500,
    "unreadMessages": 5,
    "activeConversations": 3
  }
}
```

---

## Database Schema

### Table: Reviews
```sql
- id: uuid (PK)
- product_id: uuid (FK -> Products.id, not null)
- user_id: uuid (FK -> Users.id, not null)
- order_id: uuid (FK -> Orders.id)
- rating: int (not null, 1-5)
- title: text
- comment: text
- images: text[] (array)
- is_verified: boolean (default: false)
- helpful_count: int (default: 0)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: ReviewHelpful
```sql
- id: autoincrement (PK)
- review_id: uuid (FK -> Reviews.id, not null)
- user_id: uuid (FK -> Users.id, not null)
- created_at: int64 (not null)
```

### Table: Conversations
```sql
- id: uuid (PK)
- type: conversation_type (default: 'direct')
- title: text
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

### Table: ConversationParticipants
```sql
- id: autoincrement (PK)
- conversation_id: uuid (FK -> Conversations.id, not null)
- user_id: uuid (FK -> Users.id, not null)
- role: text
- joined_at: int64 (not null)
```

### Table: ChatMessages
```sql
- id: uuid (PK)
- conversation_id: uuid (FK -> Conversations.id, not null)
- sender_id: uuid (FK -> Users.id, not null)
- message_type: message_type (default: 'text')
- content: text (not null)
- attachments: text[] (array)
- is_read: boolean (default: false)
- created_at: int64 (not null)
- updated_at: int64 (not null)
```

## Enums

### ConversationType
- `direct`: Chat 1-1
- `group`: Chat nhóm

### MessageType
- `text`: Tin nhắn text
- `image`: Hình ảnh
- `file`: File đính kèm

## Business Logic

### Review

1. **Review Rules**:
   - Chỉ buyer đã mua sản phẩm mới được review (nếu có orderId)
   - Mỗi order chỉ review 1 lần
   - Có thể edit review trong thời gian nhất định
   - Admin có thể xóa review vi phạm

2. **Rating Calculation**:
   - Product rating = average of all reviews
   - Store rating = average of all product ratings
   - Auto-update khi có review mới/sửa/xóa

3. **Verified Reviews**:
   - Review có orderId = verified
   - Verified reviews được ưu tiên hiển thị

4. **Helpful Votes**:
   - Mỗi user chỉ vote 1 lần
   - Sort reviews by helpful count

### Chat

1. **Conversation Types**:
   - Direct: Chat giữa 2 users
   - Group: Chat nhóm (nhiều users)

2. **Message Delivery**:
   - Real-time qua WebSocket hoặc Pusher
   - Fallback polling nếu WebSocket không available
   - Push notification khi có message mới

3. **Read Status**:
   - Track unread messages per user
   - Mark as read khi user xem conversation
   - Show unread count badge

4. **Message Types**:
   - Text: Plain text
   - Image: Upload image, lưu URL
   - File: Upload file, lưu URL

## Permissions

- **Create review**: Buyer (đã mua sản phẩm)
- **View reviews**: Public
- **Update own review**: Review owner
- **Delete own review**: Review owner
- **Delete any review**: Admin
- **Create conversation**: Any authenticated user
- **View conversation**: Participants only
- **Send message**: Participants only
- **Delete message**: Sender only

## Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Review/Conversation not found
- `409`: Conflict (đã review rồi)
- `422`: Validation error
- `500`: Internal Server Error

## Notes

- Implement real-time chat với WebSocket hoặc Pusher
- Support file upload cho images và files
- Rate limiting cho message sending
- Content moderation cho reviews và messages
- Support emoji và rich text trong messages
- Search messages trong conversation
- Archive old conversations
- Support message reactions (nếu có)
- Track online status của users
- Support typing indicators

