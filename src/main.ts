import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with secure configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'https://nyamula-logistics-landing.vercel.app',
    'https://www.nyamula.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in whitelist
      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow any localhost
        if (
          process.env.NODE_ENV === 'development' &&
          origin.includes('localhost')
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  const environment = process.env.NODE_ENV || 'development';
  console.log(
    `🚀 Nyamula Logistics Backend running on http://localhost:${port}`,
  );
  console.log(`📝 Environment: ${environment}`);
  console.log(`🔐 CORS enabled for: ${corsOrigins.join(', ')}`);
}
bootstrap();
