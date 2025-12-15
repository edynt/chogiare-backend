export class ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  role: string | null;
  joinedAt: bigint;
  lastReadAt: bigint | null;
  metadata: Record<string, unknown>;
}
