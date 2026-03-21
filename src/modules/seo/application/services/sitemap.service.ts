import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/database/prisma.service';
import { PRODUCT_STATUS } from '@common/constants/enum.constants';

const BASE_URL = 'https://chogiare.com';

/**
 * Generates dynamic sitemap.xml including all active product pages.
 * Includes static pages + dynamic product URLs for search engine crawling.
 */
@Injectable()
export class SitemapService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSitemap(): Promise<string> {
    const now = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/products', priority: '0.9', changefreq: 'daily' },
      { loc: '/auth/login', priority: '0.3', changefreq: 'monthly' },
      { loc: '/auth/register', priority: '0.3', changefreq: 'monthly' },
    ];

    // Fetch all active products (id and updatedAt only for performance)
    const products = await this.prisma.product.findMany({
      where: { status: PRODUCT_STATUS.ACTIVE },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000, // Sitemap limit
    });

    // Fetch unique seller IDs for shop pages
    const sellers = await this.prisma.product.groupBy({
      by: ['sellerId'],
      where: { status: PRODUCT_STATUS.ACTIVE },
    });

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const page of staticPages) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Product pages
    for (const product of products) {
      const lastmod = product.updatedAt
        ? new Date(Number(product.updatedAt)).toISOString().split('T')[0]
        : now;
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/products/${product.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Shop pages
    for (const seller of sellers) {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/shop/${seller.sellerId}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }
}
