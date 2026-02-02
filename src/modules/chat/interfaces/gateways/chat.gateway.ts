import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from '@modules/chat/application/services/chat.service';
import { SendMessageDto } from '@modules/chat/application/dto/send-message.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';
import { MessageTypeValue } from '@common/constants/enum.constants';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.CORS_ORIGIN || '',
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/chat',
  transports: ['polling', 'websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<number, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
      if (isNaN(userId)) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid user ID`);
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.status) {
        this.logger.warn(`Client ${client.id} disconnected: User not found or locked`);
        client.disconnect();
        return;
      }

      client.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      await client.join(`user:${userId}`);

      this.logger.log(
        `Client ${client.id} connected as user ${userId}, joined room user:${userId}`,
      );
      this.logger.log(
        `Total connected users: ${this.userSockets.size}, user ${userId} has ${this.userSockets.get(userId)?.size || 0} connections`,
      );
    } catch (error) {
      this.logger.error(`Error handling connection for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client ${client.id} disconnected from user ${client.userId}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number; content: string; messageType?: MessageTypeValue },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const sendDto: SendMessageDto = {
        content: data.content,
        messageType: data.messageType,
      };

      const message = await this.chatService.sendMessage(
        data.conversationId,
        client.userId,
        sendDto,
      );

      const conversation = await this.chatService.getConversation(
        data.conversationId,
        client.userId,
      );
      const participants = conversation.participants;

      // Emit to ALL participants (including sender for realtime confirmation)
      participants.forEach((participant) => {
        this.logger.log(
          `Emitting new_message to user:${participant.userId} for conversation ${data.conversationId}`,
        );
        this.server.to(`user:${participant.userId}`).emit('new_message', {
          conversationId: data.conversationId,
          message,
        });
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message:`, error);
      return { error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await client.join(`conversation:${data.conversationId}`);
      return { success: true, conversationId: data.conversationId };
    } catch (error) {
      this.logger.error(`Error joining conversation:`, error);
      return { error: 'Failed to join conversation' };
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await client.leave(`conversation:${data.conversationId}`);
      return { success: true, conversationId: data.conversationId };
    } catch (error) {
      this.logger.error(`Error leaving conversation:`, error);
      return { error: 'Failed to leave conversation' };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      await this.chatService.markAsRead(data.conversationId, client.userId);

      // Notify other participants that messages were read
      const conversation = await this.chatService.getConversation(
        data.conversationId,
        client.userId,
      );
      conversation.participants.forEach((participant) => {
        if (participant.userId !== client.userId) {
          this.server.to(`user:${participant.userId}`).emit('message_read', {
            conversationId: data.conversationId,
            userId: client.userId,
          });
        }
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking as read:`, error);
      return { error: 'Failed to mark as read' };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: number; isTyping: boolean },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const conversation = await this.chatService.getConversation(
        data.conversationId,
        client.userId,
      );

      // Broadcast typing status to other participants
      conversation.participants.forEach((participant) => {
        if (participant.userId !== client.userId) {
          this.server.to(`user:${participant.userId}`).emit('user_typing', {
            conversationId: data.conversationId,
            userId: client.userId,
            isTyping: data.isTyping,
          });
        }
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling typing:`, error);
      return { error: 'Failed to send typing indicator' };
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // 1. Try Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Try auth object or query params
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof token === 'string') {
      return token;
    }

    // 3. Try cookies (for cookie-based auth)
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const cookieObj = this.parseCookies(cookies);
      if (cookieObj.accessToken) {
        return cookieObj.accessToken;
      }
    }

    return null;
  }

  private parseCookies(cookieString: string): Record<string, string> {
    return cookieString.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = decodeURIComponent(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  private async verifyToken(token: string): Promise<{ sub: number | string } | null> {
    try {
      const secret = this.configService.get<string>('jwt.secret');
      if (!secret) {
        return null;
      }

      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error) {
      return null;
    }
  }
}
