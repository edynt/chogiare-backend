import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClientConfig(databaseUrl: string) {
  const logConfig = [
    { emit: 'event' as const, level: 'query' as const },
    { emit: 'stdout' as const, level: 'error' as const },
    { emit: 'stdout' as const, level: 'info' as const },
    { emit: 'stdout' as const, level: 'warn' as const },
  ];

  if (databaseUrl.startsWith('prisma+')) {
    return {
      log: logConfig,
      errorFormat: 'pretty' as const,
      accelerateUrl: databaseUrl,
    };
  }

  // Enable SSL for remote databases (e.g. AWS RDS)
  const needsSsl = databaseUrl.includes('rds.amazonaws.com') || databaseUrl.includes('sslmode=require');
  const pool = new Pool({
    connectionString: databaseUrl,
    ...(needsSsl && { ssl: { rejectUnauthorized: false } }),
  });
  const adapter = new PrismaPg(pool);
  return {
    adapter,
    log: logConfig,
    errorFormat: 'pretty' as const,
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL') || '';
    super(createPrismaClientConfig(databaseUrl));
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Prisma disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from database', error);
    }
  }
}
