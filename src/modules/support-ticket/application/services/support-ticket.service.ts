import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { TICKET_STATUS, TICKET_PRIORITY } from '@common/constants/enum.constants';
import { MESSAGES } from '@common/constants/messages.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { QuerySupportTicketDto } from '../dto/query-support-ticket.dto';

@Injectable()
export class SupportTicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateSupportTicketDto) {
    const now = BigInt(Date.now());

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority ?? TICKET_PRIORITY.MEDIUM,
        status: TICKET_STATUS.OPEN,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toString(),
    };
  }

  async getMyTickets(userId: number, query: QuerySupportTicketDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { userId };
    if (query.status !== undefined) where.status = query.status;
    if (query.category !== undefined) where.category = query.category;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        replies: t._count.replies,
        createdAt: t.createdAt.toString(),
        updatedAt: t.updatedAt.toString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(ticketId: number, userId: number) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
        },
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.FORBIDDEN,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toString(),
      updatedAt: ticket.updatedAt.toString(),
      user: ticket.user,
      replies: ticket.replies.map((r) => ({
        id: r.id,
        message: r.message,
        isInternal: r.isInternal,
        createdAt: r.createdAt.toString(),
        user: r.user,
      })),
    };
  }

  async reply(ticketId: number, userId: number, message: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException({
        message: MESSAGES.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException({
        message: MESSAGES.FORBIDDEN,
        errorCode: ERROR_CODES.FORBIDDEN,
      });
    }

    const now = BigInt(Date.now());

    const reply = await this.prisma.ticketReply.create({
      data: {
        ticketId,
        userId,
        message,
        isInternal: false,
        createdAt: now,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    // Update ticket updatedAt
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: now },
    });

    return {
      id: reply.id,
      message: reply.message,
      isInternal: reply.isInternal,
      createdAt: reply.createdAt.toString(),
      user: reply.user,
    };
  }
}
