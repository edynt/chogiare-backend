import { Module } from '@nestjs/common';
import { AddressController } from './interfaces/controllers/address.controller';
import { AddressService } from './application/services/address.service';
import { AddressRepository } from './infrastructure/repositories/address.repository';
import { ADDRESS_REPOSITORY } from './domain/repositories/address.repository.interface';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AddressController],
  providers: [
    AddressService,
    {
      provide: ADDRESS_REPOSITORY,
      useClass: AddressRepository,
    },
  ],
  exports: [AddressService, ADDRESS_REPOSITORY],
})
export class AddressModule {}
