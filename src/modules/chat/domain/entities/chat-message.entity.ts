export class ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  messageType: string;
  content: string;
  isRead: boolean;
  messageMetadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
