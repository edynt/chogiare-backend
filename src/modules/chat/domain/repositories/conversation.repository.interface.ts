import { Conversation } from '../entities/conversation.entity';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export interface IConversationRepository {
  findById(id: number): Promise<Conversation | null>;
  findByUserId(userId: number, options?: {
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Conversation[]; total: number }>;
  findByParticipants(userId1: number, userId2: number): Promise<Conversation | null>;
  create(conversation: Partial<Conversation>): Promise<Conversation>;
  update(id: number, conversation: Partial<Conversation>): Promise<Conversation>;
  delete(id: number): Promise<void>;
  exists(id: number): Promise<boolean>;
}

