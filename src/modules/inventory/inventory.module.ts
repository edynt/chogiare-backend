import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { ProductModule } from '@modules/product/product.module';
import { InventoryService } from './application/services/inventory.service';
import { InventoryController } from './interfaces/controllers/inventory.controller';
import { InventoryRepository } from './infrastructure/repositories/inventory.repository';
import { INVENTORY_REPOSITORY } from './domain/repositories/inventory.repository.interface';

@Module({
  imports: [DatabaseModule, ProductModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: InventoryRepository,
    },
  ],
  exports: [InventoryService, INVENTORY_REPOSITORY],
})
export class InventoryModule {}
