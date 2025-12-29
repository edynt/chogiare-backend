import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { APP_NAME } from '@common/constants/app.constants';
import { ERROR_CODES } from '@common/constants/error-codes.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const formatErrors = (
          validationErrors: ValidationError[],
          parentPath = '',
        ): Record<string, string[]> => {
          const result: Record<string, string[]> = {};

          for (const error of validationErrors) {
            const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;

            if (error.constraints) {
              result[propertyPath] = Object.values(error.constraints);
            }

            if (error.children && error.children.length > 0) {
              const childErrors = formatErrors(error.children, propertyPath);
              Object.assign(result, childErrors);
            }
          }

          return result;
        };

        const fieldErrors = formatErrors(errors);
        const firstError = Object.values(fieldErrors)[0]?.[0] || 'Validation failed';

        return new BadRequestException({
          message: firstError,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          details: {
            fields: fieldErrors,
          },
        });
      },
    }),
  );

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : nodeEnv === 'production'
      ? []
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000',
        ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (nodeEnv === 'development') {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        if (isLocalhost || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
      }

      if (corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(`${APP_NAME} Wholesale Marketplace API`)
      .setDescription(`Backend API documentation for ${APP_NAME} Wholesale Marketplace`)
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    });
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    });

    logger.log(`Swagger documentation available at: http://localhost:${port}/${apiPrefix}/docs`);
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
