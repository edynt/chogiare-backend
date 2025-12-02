import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@common/config/config.module';
import { DatabaseModule } from '@common/database/database.module';
import { SupabaseModule } from '@common/database/supabase.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [ConfigModule, DatabaseModule, SupabaseModule, AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

