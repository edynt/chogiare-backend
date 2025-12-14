import { ChatMessage } from '../entities/chat-message.entity';

export const CHAT_MESSAGE_REPOSITORY = Symbol('CHAT_MESSAGE_REPOSITORY');

export interface IChatMessageRepository {
  findById(id: number): Promise<ChatMessage | null>;
  findByConversationId(conversationId: number, options?: {
    page?: number;
    pageSize?: number;
    before?: bigint;
  }): Promise<{ items: ChatMessage[]; total: number }>;
  create(message: Partial<ChatMessage>): Promise<ChatMessage>;
  markAsRead(conversationId: number, userId: number): Promise<void>;
  markMessageAsRead(conversationId: number, messageId: number, userId: number): Promise<void>;
  countUnread(conversationId: number, userId: number): Promise<number>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
}

