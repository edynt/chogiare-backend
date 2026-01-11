import { Module } from '@nestjs/common';
import { AdminPackagesController } from './interfaces/controllers';
import { AdminPackagesService } from './application/services';
import { PrismaService } from '../../../common/database/prisma.service';

@Module({
  controllers: [AdminPackagesController],
  providers: [AdminPackagesService, PrismaService],
  exports: [AdminPackagesService],
})
export class AdminPackagesModule {}
