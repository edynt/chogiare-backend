import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
    ].filter(Boolean),
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket'],
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<number, Set<string>>();

  constructor(
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

      this.logger.log(`Notification client ${client.id} connected as user ${userId}`);
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
      this.logger.log(`Notification client ${client.id} disconnected from user ${client.userId}`);
    }
  }

  /**
   * Send notification to specific user via WebSocket
   */
  sendNotificationToUser(userId: number, notification: NotificationPayload) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
    this.logger.log(`Sent notification to user ${userId}: ${notification.title}`);
  }

  /**
   * Send notification to multiple users
   */
  sendNotificationToUsers(userIds: number[], notification: NotificationPayload) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Check if user is currently connected
   */
  isUserConnected(userId: number): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
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
    } catch {
      return null;
    }
  }
}
