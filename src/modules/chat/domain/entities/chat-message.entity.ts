export class ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  messageType: number;
  content: string;
  isRead: boolean;
  messageMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
