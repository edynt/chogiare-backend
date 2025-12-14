import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IConversationParticipantRepository } from '@modules/chat/domain/repositories/conversation-participant.repository.interface';
import { ConversationParticipant } from '@modules/chat/domain/entities/conversation-participant.entity';
import { ConversationParticipant as PrismaConversationParticipant } from '@prisma/client';

@Injectable()
export class ConversationParticipantRepository implements IConversationParticipantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConversationId(conversationId: number): Promise<ConversationParticipant[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });
    return participants.map((p) => this.toDomain(p));
  }

  async findByUserIdAndConversationId(
    userId: number,
    conversationId: number,
  ): Promise<ConversationParticipant | null> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    return participant ? this.toDomain(participant) : null;
  }

  async create(participant: Partial<ConversationParticipant>): Promise<ConversationParticipant> {
    const created = await this.prisma.conversationParticipant.create({
      data: {
        conversationId: participant.conversationId!,
        userId: participant.userId!,
        role: participant.role || null,
        joinedAt: participant.joinedAt!,
        lastReadAt: participant.lastReadAt || null,
        metadata: (participant.metadata as object) || {},
      },
    });
    return this.toDomain(created);
  }

  async updateLastReadAt(
    conversationId: number,
    userId: number,
    lastReadAt: bigint,
  ): Promise<void> {
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt,
      },
    });
  }

  async delete(conversationId: number, userId: number): Promise<void> {
    await this.prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
  }

  async exists(conversationId: number, userId: number): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: {
        conversationId,
        userId,
      },
    });
    return count > 0;
  }

  private toDomain(prismaParticipant: PrismaConversationParticipant): ConversationParticipant {
    return {
      id: prismaParticipant.id,
      conversationId: prismaParticipant.conversationId,
      userId: prismaParticipant.userId,
      role: prismaParticipant.role,
      joinedAt: prismaParticipant.joinedAt,
      lastReadAt: prismaParticipant.lastReadAt,
      metadata: prismaParticipant.metadata as Record<string, unknown>,
    };
  }
}
