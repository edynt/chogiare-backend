import { Module } from '@nestjs/common';
import { StoreService } from './application/services/store.service';
import { StoreController } from './interfaces/controllers/store.controller';
import { StoreRepository } from './infrastructure/repositories/store.repository';
import {
  STORE_REPOSITORY,
  IStoreRepository,
} from './domain/repositories/store.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [StoreController],
  providers: [
    StoreService,
    {
      provide: STORE_REPOSITORY,
      useClass: StoreRepository,
    },
  ],
  exports: [StoreService, STORE_REPOSITORY],
})
export class StoreModule {}

