import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Enable CORS with secure configuration
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'https://nyamula-logistics-landing.vercel.app',
    'https://www.nyamula.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:8080',
  ];

  // Log all incoming requests to debug CORS
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url} from ${req.headers.origin || 'no-origin'}`);
    
    // Set CORS headers on every response
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Origin, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '3600');
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      console.log('✅ Responding to OPTIONS preflight');
      return res.status(204).end();
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
