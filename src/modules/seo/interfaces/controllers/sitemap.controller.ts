import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { SitemapService } from '../../application/services/sitemap.service';

@ApiTags('SEO')
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
  @ApiOperation({ summary: 'Generate dynamic sitemap.xml' })
  @ApiProduces('application/xml')
  async getSitemap(): Promise<string> {
    return this.sitemapService.generateSitemap();
  }
}
