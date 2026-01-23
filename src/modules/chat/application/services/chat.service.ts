import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import {
  IConversationRepository,
  CONVERSATION_REPOSITORY,
} from '@modules/chat/domain/repositories/conversation.repository.interface';
import {
  IChatMessageRepository,
  CHAT_MESSAGE_REPOSITORY,
} from '@modules/chat/domain/repositories/chat-message.repository.interface';
import {
  IConversationParticipantRepository,
  CONVERSATION_PARTICIPANT_REPOSITORY,
} from '@modules/chat/domain/repositories/conversation-participant.repository.interface';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { QueryConversationsDto } from '../dto/query-conversations.dto';
import { QueryMessagesDto } from '../dto/query-messages.dto';
import { ConversationType, MessageType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY)
    private readonly chatMessageRepository: IChatMessageRepository,
    @Inject(CONVERSATION_PARTICIPANT_REPOSITORY)
    private readonly participantRepository: IConversationParticipantRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createConversation(userId: number, createDto: CreateConversationDto) {
    if (userId === createDto.otherUserId) {
      throw new BadRequestException({
        message: MESSAGES.CHAT.CANNOT_CHAT_WITH_SELF,
        errorCode: ERROR_CODES.CHAT_CANNOT_CHAT_WITH_SELF,
      });
    }

    const otherUser = await this.prisma.user.findUnique({
      where: { id: createDto.otherUserId },
    });

    if (!otherUser) {
      throw new NotFoundException({
        message: MESSAGES.USER.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    let conversation = await this.conversationRepository.findByParticipants(
      userId,
      createDto.otherUserId,
    );

    if (conversation) {
      return {
        ...conversation,
        createdAt: conversation.createdAt.toString(),
        updatedAt: conversation.updatedAt.toString(),
      };
    }

    const now = BigInt(Date.now());
    conversation = await this.conversationRepository.create({
      type: ConversationType.direct,
      title: createDto.title || null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all([
      this.participantRepository.create({
        conversationId: conversation.id,
        userId,
        role: null,
        joinedAt: now,
        lastReadAt: now,
        metadata: {},
      }),
      this.participantRepository.create({
        conversationId: conversation.id,
        userId: createDto.otherUserId,
        role: null,
        joinedAt: now,
        lastReadAt: null,
        metadata: {},
      }),
    ]);

    const participants = await this.participantRepository.findByConversationId(conversation.id);
    const userInfos = await Promise.all(
      participants.map(async (p) => {
        const user = await this.prisma.user.findUnique({
          where: { id: p.userId },
        });
        return {
          userId: p.userId,
          fullName: user?.fullName || null,
          avatarUrl: user?.avatarUrl || null,
        };
      }),
    );

    return {
      ...conversation,
      createdAt: conversation.createdAt.toString(),
      updatedAt: conversation.updatedAt.toString(),
      participants: userInfos,
    };
  }

  async getConversations(userId: number, queryDto: QueryConversationsDto) {
    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 10;

    const result = await this.conversationRepository.findByUserId(userId, {
      page,
      pageSize,
    });

    const conversations = await Promise.all(
      result.items.map(async (conversation) => {
        const participants = await this.participantRepository.findByConversationId(conversation.id);
        const otherParticipant = participants.find((p) => p.userId !== userId);
        const unreadCount = await this.chatMessageRepository.countUnread(conversation.id, userId);

        const lastMessage = await this.prisma.chatMessage.findFirst({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'desc' },
        });

        let otherUserInfo = null;
        if (otherParticipant) {
          const user = await this.prisma.user.findUnique({
            where: { id: otherParticipant.userId },
          });
          otherUserInfo = {
            userId: otherParticipant.userId,
            fullName: user?.fullName || null,
            avatarUrl: user?.avatarUrl || null,
          };
        }

        return {
          ...conversation,
          createdAt: conversation.createdAt.toString(),
          updatedAt: conversation.updatedAt.toString(),
          otherUser: otherUserInfo,
          unreadCount,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                messageType: lastMessage.messageType,
                senderId: lastMessage.senderId,
                createdAt: lastMessage.createdAt.toString(),
              }
            : null,
        };
      }),
    );

    return {
      items: conversations,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async getConversation(conversationId: number, userId: number) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const participants = await this.participantRepository.findByConversationId(conversationId);
    const otherParticipant = participants.find((p) => p.userId !== userId);

    const userInfos = await Promise.all(
      participants.map(async (p) => {
        const user = await this.prisma.user.findUnique({
          where: { id: p.userId },
        });
        return {
          userId: p.userId,
          fullName: user?.fullName || null,
          avatarUrl: user?.avatarUrl || null,
        };
      }),
    );

    // Get otherUser info for frontend display
    let otherUserInfo = null;
    if (otherParticipant) {
      const otherUser = await this.prisma.user.findUnique({
        where: { id: otherParticipant.userId },
      });
      otherUserInfo = {
        userId: otherParticipant.userId,
        fullName: otherUser?.fullName || null,
        avatarUrl: otherUser?.avatarUrl || null,
      };
    }

    return {
      ...conversation,
      createdAt: conversation.createdAt.toString(),
      updatedAt: conversation.updatedAt.toString(),
      participants: userInfos,
      otherUser: otherUserInfo,
    };
  }

  async sendMessage(conversationId: number, userId: number, sendDto: SendMessageDto) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const now = BigInt(Date.now());
    const message = await this.chatMessageRepository.create({
      conversationId,
      senderId: userId,
      messageType: sendDto.messageType || MessageType.text,
      content: sendDto.content,
      isRead: false,
      messageMetadata: {},
      createdAt: now,
      updatedAt: now,
    });

    await this.conversationRepository.update(conversationId, {
      updatedAt: now,
    });

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    return {
      ...message,
      createdAt: message.createdAt.toString(),
      updatedAt: message.updatedAt.toString(),
      sender: {
        userId: sender?.id,
        fullName: sender?.fullName || null,
        avatarUrl: sender?.avatarUrl || null,
      },
    };
  }

  async getMessages(conversationId: number, userId: number, queryDto: QueryMessagesDto) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const page = queryDto.page || 1;
    const pageSize = queryDto.pageSize || 20;
    const before = queryDto.before ? BigInt(queryDto.before) : undefined;

    const result = await this.chatMessageRepository.findByConversationId(conversationId, {
      page,
      pageSize,
      before,
    });

    const messages = await Promise.all(
      result.items.map(async (message) => {
        const sender = await this.prisma.user.findUnique({
          where: { id: message.senderId },
        });
        return {
          ...message,
          createdAt: message.createdAt.toString(),
          updatedAt: message.updatedAt.toString(),
          sender: {
            userId: sender?.id,
            fullName: sender?.fullName || null,
            avatarUrl: sender?.avatarUrl || null,
          },
        };
      }),
    );

    return {
      items: messages,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    };
  }

  async markAsRead(conversationId: number, userId: number) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const now = BigInt(Date.now());
    await Promise.all([
      this.chatMessageRepository.markAsRead(conversationId, userId),
      this.participantRepository.updateLastReadAt(conversationId, userId, now),
    ]);
  }

  async getMessage(messageId: number, userId: number) {
    const message = await this.chatMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.MESSAGE_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_MESSAGE_NOT_FOUND || 'CHAT_MESSAGE_NOT_FOUND',
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      message.conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: message.senderId },
    });

    return {
      ...message,
      createdAt: message.createdAt.toString(),
      updatedAt: message.updatedAt.toString(),
      sender: {
        userId: sender?.id,
        fullName: sender?.fullName || null,
        avatarUrl: sender?.avatarUrl || null,
      },
    };
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await this.chatMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.MESSAGE_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_MESSAGE_NOT_FOUND || 'CHAT_MESSAGE_NOT_FOUND',
      });
    }

    if (message.senderId !== userId) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    await this.chatMessageRepository.delete(messageId);
  }

  async addParticipant(conversationId: number, targetUserId: number, userId: number) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const exists = await this.participantRepository.exists(conversationId, targetUserId);
    if (exists) {
      throw new BadRequestException({
        message: MESSAGES.CHAT.PARTICIPANT_ALREADY_EXISTS || 'Participant already exists',
        errorCode: ERROR_CODES.CHAT_PARTICIPANT_ALREADY_EXISTS || 'CHAT_PARTICIPANT_ALREADY_EXISTS',
      });
    }

    const now = BigInt(Date.now());
    await this.participantRepository.create({
      conversationId,
      userId: targetUserId,
      role: null,
      joinedAt: now,
      lastReadAt: null,
      metadata: {},
    });
  }

  async removeParticipant(conversationId: number, targetUserId: number, userId: number) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    await this.participantRepository.delete(conversationId, targetUserId);
  }

  async markMessageAsRead(conversationId: number, messageId: number, userId: number) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException({
        message: MESSAGES.CHAT.CONVERSATION_NOT_FOUND,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND,
      });
    }

    const participant = await this.participantRepository.findByUserIdAndConversationId(
      userId,
      conversationId,
    );

    if (!participant) {
      throw new UnauthorizedException({
        message: MESSAGES.CHAT.UNAUTHORIZED_ACCESS,
        errorCode: ERROR_CODES.CHAT_CONVERSATION_UNAUTHORIZED,
      });
    }

    const now = BigInt(Date.now());
    await Promise.all([
      this.chatMessageRepository.markMessageAsRead(conversationId, messageId, userId),
      this.participantRepository.updateLastReadAt(conversationId, userId, now),
    ]);
  }

  async getChatStats(userId?: number) {
    const where: Record<string, unknown> = {};

    if (userId) {
      where.participants = {
        some: {
          userId,
        },
      };
    }

    const conversations = await this.prisma.conversation.count({ where });
    const messages = await this.prisma.chatMessage.count({
      where: userId
        ? {
            conversation: {
              participants: {
                some: {
                  userId,
                },
              },
            },
          }
        : {},
    });

    return {
      totalConversations: conversations,
      totalMessages: messages,
    };
  }
}
