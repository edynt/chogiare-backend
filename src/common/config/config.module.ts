import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import supabaseConfig from './supabase.config';
import jwtConfig from './jwt.config';
import appConfig from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [supabaseConfig, jwtConfig, appConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
