import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Ensure Prisma BigInt minor-unit fields serialize safely to JSON strings
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const logger = new Logger('VagrovaBootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global API routing prefix
  app.setGlobalPrefix('api/v1');

  // Strict server-side validation & payload sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Cross-Origin Resource Sharing for Admin & Mobile Web
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚛 VAGROVA ENTERPRISE HAULAGE API RUNNING`);
  logger.log(`📡 URL: http://localhost:${port}/api/v1`);
  logger.log(`🛡️  RBAC & Immutable Audit Trail: ACTIVE`);
  logger.log(`=======================================================`);
}

bootstrap();

