import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import jwtConfig from './jwt.config';
import appConfig from './app.config';
import cloudinaryConfig from './cloudinary.config';
import mailConfig from './mail.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [jwtConfig, appConfig, cloudinaryConfig, mailConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
