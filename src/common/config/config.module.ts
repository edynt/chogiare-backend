import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import jwtConfig from './jwt.config';
import appConfig from './app.config';
import s3Config from './s3.config';
import mailConfig from './mail.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [jwtConfig, appConfig, s3Config, mailConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
