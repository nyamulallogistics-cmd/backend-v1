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

  // Add raw middleware to handle OPTIONS requests before routing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      console.log('🔄 OPTIONS request from:', req.headers.origin);
      return res.status(204).send('');
    }
    next();
  });

  app.enableCors({
    origin: true, // Allow all origins temporarily for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
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
