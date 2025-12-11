import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from '@modules/chat/application/services/chat.service';
import { CreateConversationDto } from '@modules/chat/application/dto/create-conversation.dto';
import { SendMessageDto } from '@modules/chat/application/dto/send-message.dto';
import { QueryConversationsDto } from '@modules/chat/application/dto/query-conversations.dto';
import { QueryMessagesDto } from '@modules/chat/application/dto/query-messages.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '@common/decorators/current-user.decorator';
import { MESSAGES } from '@common/constants/messages.constants';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createDto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.createConversation(user.id, createDto);
    return {
      message: MESSAGES.CHAT.CONVERSATION_CREATED,
      data: conversation,
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getConversations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() queryDto: QueryConversationsDto,
  ) {
    const result = await this.chatService.getConversations(user.id, queryDto);
    return {
      message: MESSAGES.CHAT.CONVERSATIONS_RETRIEVED,
      data: result,
    };
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiParam({ name: 'id', type: Number })
  async getConversation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const conversation = await this.chatService.getConversation(conversationId, user.id);
    return {
      message: MESSAGES.CHAT.CONVERSATION_RETRIEVED,
      data: conversation,
    };
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'id', type: Number })
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() sendDto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(conversationId, user.id, sendDto);
    return {
      message: MESSAGES.CHAT.MESSAGE_SENT,
      data: message,
    };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages from a conversation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'before', required: false, type: String })
  async getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() queryDto: QueryMessagesDto,
  ) {
    const result = await this.chatService.getMessages(conversationId, user.id, queryDto);
    return {
      message: MESSAGES.CHAT.MESSAGES_RETRIEVED,
      data: result,
    };
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read in a conversation' })
  @ApiParam({ name: 'id', type: Number })
  async markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    await this.chatService.markAsRead(conversationId, user.id);
    return {
      message: MESSAGES.CHAT.MESSAGES_MARKED_AS_READ,
    };
  }
}
