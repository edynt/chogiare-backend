import { Module } from '@nestjs/common';
import { CustomerController } from './interfaces/controllers/customer.controller';
import { CustomerService } from './application/services/customer.service';
import { CustomerRepository } from './infrastructure/repositories/customer.repository';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository.interface';
import { AuthModule } from '@modules/auth/auth.module';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    {
      provide: CUSTOMER_REPOSITORY,
      useClass: CustomerRepository,
    },
  ],
  exports: [CustomerService, CUSTOMER_REPOSITORY],
})
export class CustomerModule {}
