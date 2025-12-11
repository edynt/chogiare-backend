import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './interfaces/controllers/chat.controller';
import { ChatGateway } from './interfaces/gateways/chat.gateway';
import { ChatService } from './application/services/chat.service';
import { ConversationRepository } from './infrastructure/repositories/conversation.repository';
import { ChatMessageRepository } from './infrastructure/repositories/chat-message.repository';
import { ConversationParticipantRepository } from './infrastructure/repositories/conversation-participant.repository';
import { CONVERSATION_REPOSITORY } from './domain/repositories/conversation.repository.interface';
import { CHAT_MESSAGE_REPOSITORY } from './domain/repositories/chat-message.repository.interface';
import { CONVERSATION_PARTICIPANT_REPOSITORY } from './domain/repositories/conversation-participant.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: ConversationRepository,
    },
    {
      provide: CHAT_MESSAGE_REPOSITORY,
      useClass: ChatMessageRepository,
    },
    {
      provide: CONVERSATION_PARTICIPANT_REPOSITORY,
      useClass: ConversationParticipantRepository,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
