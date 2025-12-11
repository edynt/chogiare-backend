export class Conversation {
  id: number;
  type: string;
  title: string | null;
  metadata: Record<string, unknown>;
  createdAt: bigint;
  updatedAt: bigint;
}

