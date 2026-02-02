export class Conversation {
  id: number;
  type: number;
  title: string | null;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}
