import { Module } from '@nestjs/common';
import { DatabaseModule } from '@common/database/database.module';
import { AdminUserService } from './application/services/admin-user.service';
import { AdminUserController } from './interfaces/controllers/admin-user.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminUsersModule {}
