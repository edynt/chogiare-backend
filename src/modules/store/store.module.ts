import { Module } from '@nestjs/common';
import { StoreController } from './interfaces/controllers/store.controller';
import { StoreService } from './application/services/store.service';
import { StoreRepository } from './infrastructure/repositories/store.repository';
import { STORE_REPOSITORY } from './domain/repositories/store.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
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
