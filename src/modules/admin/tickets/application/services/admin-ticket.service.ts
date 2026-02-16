import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { TICKET_STATUS } from '@common/constants/enum.constants';
import { QueryAdminTicketDto } from '../dto/query-admin-ticket.dto';

// Maps numeric enum values to string labels for admin API responses
const STATUS_LABELS: Record<number, string> = {
  0: 'open',
  1: 'in_progress',
  2: 'pending',
  3: 'resolved',
  4: 'closed',
};
const PRIORITY_LABELS: Record<number, string> = {
  0: 'low',
  1: 'medium',
  2: 'high',
  3: 'urgent',
};
const CATEGORY_LABELS: Record<number, string> = {
  0: 'account',
  1: 'product',
  2: 'payment',
  3: 'technical',
  4: 'report',
  5: 'question',
  6: 'other',
};

// Reverse maps: string label → numeric value (for query filtering)
const STATUS_VALUES: Record<string, number> = {
  open: 0,
  in_progress: 1,
  pending: 2,
  resolved: 3,
  closed: 4,
};
const PRIORITY_VALUES: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};
const CATEGORY_VALUES: Record<string, number> = {
  account: 0,
  product: 1,
  payment: 2,
  technical: 3,
  report: 4,
  question: 5,
  other: 6,
};

@Injectable()
export class AdminTicketService {
  constructor(private readonly prisma: PrismaService) {}

  async getTickets(query: QueryAdminTicketDto) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (query.status === 'active') {
      // Exclude resolved and closed tickets
      where.status = { notIn: [STATUS_VALUES.resolved, STATUS_VALUES.closed] };
    } else if (query.status !== undefined && query.status in STATUS_VALUES) {
      where.status = STATUS_VALUES[query.status];
    }
    if (query.priority !== undefined && query.priority in PRIORITY_VALUES)
      where.priority = PRIORITY_VALUES[query.priority];
    if (query.category !== undefined && query.category in CATEGORY_VALUES)
      where.category = CATEGORY_VALUES[query.category];
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, email: true, fullName: true, phoneNumber: true } },
          assignee: { select: { id: true, email: true, fullName: true } },
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: String(t.id),
        title: t.title,
        description: t.description,
        category: CATEGORY_LABELS[t.category] || 'other',
        priority: PRIORITY_LABELS[t.priority] || 'medium',
        status: STATUS_LABELS[t.status] || 'open',
        customer: {
          name: t.user.fullName || t.user.email,
          email: t.user.email,
          phone: t.user.phoneNumber || '',
        },
        assignedTo: t.assignee ? t.assignee.fullName || t.assignee.email : 'Chưa phân công',
        createdAt: new Date(Number(t.createdAt)).toISOString(),
        updatedAt: new Date(Number(t.updatedAt)).toISOString(),
        replies: t._count.replies,
        tags: t.tags,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTicketById(ticketId: number) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, email: true, fullName: true, phoneNumber: true } },
        assignee: { select: { id: true, email: true, fullName: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, email: true, fullName: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      id: String(ticket.id),
      title: ticket.title,
      description: ticket.description,
      category: CATEGORY_LABELS[ticket.category] || 'other',
      priority: PRIORITY_LABELS[ticket.priority] || 'medium',
      status: STATUS_LABELS[ticket.status] || 'open',
      customer: {
        name: ticket.user.fullName || ticket.user.email,
        email: ticket.user.email,
        phone: ticket.user.phoneNumber || '',
      },
      assignedTo: ticket.assignee
        ? ticket.assignee.fullName || ticket.assignee.email
        : 'Chưa phân công',
      createdAt: new Date(Number(ticket.createdAt)).toISOString(),
      updatedAt: new Date(Number(ticket.updatedAt)).toISOString(),
      tags: ticket.tags,
      messages: ticket.replies.map((r) => ({
        id: String(r.id),
        sender: r.user.fullName || r.user.email,
        message: r.message,
        isAdmin: r.isInternal,
        createdAt: new Date(Number(r.createdAt)).toISOString(),
      })),
    };
  }

  async updateStatus(ticketId: number, dto: { status: string }) {
    const statusNum = STATUS_VALUES[dto.status];
    if (statusNum === undefined) {
      throw new NotFoundException('Invalid status');
    }

    const now = BigInt(Date.now());
    const data: Record<string, unknown> = { status: statusNum, updatedAt: now };

    if (statusNum === TICKET_STATUS.RESOLVED) {
      data.resolvedAt = now;
    }

    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

    return { id: String(ticket.id), status: STATUS_LABELS[ticket.status] || 'open' };
  }

  async replyToTicket(ticketId: number, adminId: number, message: string) {
    const now = BigInt(Date.now());

    const reply = await this.prisma.ticketReply.create({
      data: {
        ticketId,
        userId: adminId,
        message,
        isInternal: true,
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
      id: String(reply.id),
      ticketId: String(reply.ticketId),
      message: reply.message,
      author: reply.user.fullName || reply.user.email,
      createdAt: new Date(Number(reply.createdAt)).toISOString(),
    };
  }

  async getStats() {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: TICKET_STATUS.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TICKET_STATUS.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TICKET_STATUS.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { status: TICKET_STATUS.CLOSED } }),
    ]);

    return { total, open, inProgress, resolved, closed };
  }
}
