import { Module } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { SitemapService } from './application/services/sitemap.service';
import { SitemapController } from './interfaces/controllers/sitemap.controller';

@Module({
  controllers: [SitemapController],
  providers: [SitemapService, PrismaService],
})
export class SeoModule {}
