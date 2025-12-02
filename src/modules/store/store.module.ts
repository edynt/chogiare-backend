import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { StoreRepository } from './infrastructure/repositories/store.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'IStoreRepository',
      useClass: StoreRepository,
    },
  ],
  exports: ['IStoreRepository'],
})
export class StoreModule {}

