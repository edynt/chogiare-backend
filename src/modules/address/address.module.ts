import { Module } from '@nestjs/common';
import { AddressService } from './application/services/address.service';
import { AddressController } from './interfaces/controllers/address.controller';
import { AddressRepository } from './infrastructure/repositories/address.repository';
import {
  ADDRESS_REPOSITORY,
  IAddressRepository,
} from './domain/repositories/address.repository.interface';
import { DatabaseModule } from '@common/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
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

