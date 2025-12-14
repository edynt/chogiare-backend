import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IConversationRepository } from '@modules/chat/domain/repositories/conversation.repository.interface';
import { Conversation } from '@modules/chat/domain/entities/conversation.entity';
import { Conversation as PrismaConversation, ConversationType } from '@prisma/client';

@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Conversation | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    return conversation ? this.toDomain(conversation) : null;
  }

  async findByUserId(
    userId: number,
    options?: {
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: Conversation[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.conversation.count({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
      }),
    ]);

    return {
      items: conversations.map((c) => this.toDomain(c)),
      total,
    };
  }

  async findByParticipants(userId1: number, userId2: number): Promise<Conversation | null> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        type: ConversationType.direct,
        participants: {
          some: {
            userId: userId1,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    for (const conversation of conversations) {
      const participantUserIds = conversation.participants.map((p) => p.userId);
      if (
        participantUserIds.includes(userId1) &&
        participantUserIds.includes(userId2) &&
        participantUserIds.length === 2
      ) {
        return this.toDomain(conversation);
      }
    }

    return null;
  }

  async create(conversation: Partial<Conversation>): Promise<Conversation> {
    const created = await this.prisma.conversation.create({
      data: {
        type: (conversation.type as ConversationType) || ConversationType.direct,
        title: conversation.title || null,
        metadata: (conversation.metadata as object) || {},
        createdAt: conversation.createdAt!,
        updatedAt: conversation.updatedAt!,
      },
    });
    return this.toDomain(created);
  }

  async update(id: number, conversation: Partial<Conversation>): Promise<Conversation> {
    const updateData: {
      title?: string | null;
      metadata?: object;
      updatedAt: bigint;
    } = {
      updatedAt: BigInt(Date.now()),
    };

    if (conversation.title !== undefined) updateData.title = conversation.title;
    if (conversation.metadata !== undefined) updateData.metadata = conversation.metadata as object;

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.conversation.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(prismaConversation: PrismaConversation): Conversation {
    return {
      id: prismaConversation.id,
      type: prismaConversation.type,
      title: prismaConversation.title,
      metadata: prismaConversation.metadata as Record<string, unknown>,
      createdAt: prismaConversation.createdAt,
      updatedAt: prismaConversation.updatedAt,
    };
  }
}
