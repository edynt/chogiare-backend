import { ConversationParticipant } from '../entities/conversation-participant.entity';

export const CONVERSATION_PARTICIPANT_REPOSITORY = Symbol('CONVERSATION_PARTICIPANT_REPOSITORY');

export interface IConversationParticipantRepository {
  findByConversationId(conversationId: number): Promise<ConversationParticipant[]>;
  findByUserIdAndConversationId(userId: number, conversationId: number): Promise<ConversationParticipant | null>;
  create(participant: Partial<ConversationParticipant>): Promise<ConversationParticipant>;
  delete(conversationId: number, userId: number): Promise<void>;
  updateLastReadAt(conversationId: number, userId: number, lastReadAt: bigint): Promise<void>;
  exists(conversationId: number, userId: number): Promise<boolean>;
}

