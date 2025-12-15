import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { IChatMessageRepository } from '@modules/chat/domain/repositories/chat-message.repository.interface';
import { ChatMessage } from '@modules/chat/domain/entities/chat-message.entity';
import { ChatMessage as PrismaChatMessage, MessageType } from '@prisma/client';

@Injectable()
export class ChatMessageRepository implements IChatMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<ChatMessage | null> {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id },
    });
    return message ? this.toDomain(message) : null;
  }

  async findByConversationId(
    conversationId: number,
    options?: {
      page?: number;
      pageSize?: number;
      before?: bigint;
    },
  ): Promise<{ items: ChatMessage[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: {
      conversationId: number;
      createdAt?: { lt: bigint };
    } = {
      conversationId,
    };

    if (options?.before) {
      where.createdAt = { lt: options.before };
    }

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return {
      items: messages.reverse().map((m) => this.toDomain(m)),
      total,
    };
  }

  async create(message: Partial<ChatMessage>): Promise<ChatMessage> {
    const created = await this.prisma.chatMessage.create({
      data: {
        conversationId: message.conversationId!,
        senderId: message.senderId!,
        messageType: (message.messageType as MessageType) || MessageType.text,
        content: message.content!,
        isRead: message.isRead ?? false,
        messageMetadata: (message.messageMetadata as object) || {},
        createdAt: message.createdAt!,
        updatedAt: message.updatedAt!,
      },
    });
    return this.toDomain(created);
  }

  async markAsRead(conversationId: number, userId: number): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async countUnread(conversationId: number, userId: number): Promise<number> {
    return this.prisma.chatMessage.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  async markMessageAsRead(
    conversationId: number,
    messageId: number,
    userId: number,
  ): Promise<void> {
    await this.prisma.chatMessage.updateMany({
      where: {
        id: messageId,
        conversationId,
        senderId: { not: userId },
      },
      data: {
        isRead: true,
        updatedAt: BigInt(Date.now()),
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.chatMessage.delete({
      where: { id },
    });
  }

  async exists(id: number): Promise<boolean> {
    const count = await this.prisma.chatMessage.count({
      where: { id },
    });
    return count > 0;
  }

  private toDomain(prismaMessage: PrismaChatMessage): ChatMessage {
    return {
      id: prismaMessage.id,
      conversationId: prismaMessage.conversationId,
      senderId: prismaMessage.senderId,
      messageType: prismaMessage.messageType,
      content: prismaMessage.content,
      isRead: prismaMessage.isRead,
      messageMetadata: prismaMessage.messageMetadata as Record<string, unknown>,
      createdAt: prismaMessage.createdAt,
      updatedAt: prismaMessage.updatedAt,
    };
  }
}
