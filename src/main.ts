import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TEMPORARY: Allow ALL origins for testing
  app.enableCors({
    origin: true, // This allows ANY origin
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

  const port = parseInt(process.env.PORT || '3000', 10);
  
  console.log('='.repeat(50));
  console.log('🔍 Starting server...');
  console.log(`Port from env: ${process.env.PORT || 'NOT SET'}`);
  console.log(`Binding to: 0.0.0.0:${port}`);
  console.log('='.repeat(50));
  
  await app.listen(port, '0.0.0.0');
  
  console.log('='.repeat(50));
  console.log(`✅ SERVER LISTENING ON PORT ${port}`);
  console.log(`🌐 Access at: http://0.0.0.0:${port}/api`);
  console.log(`🔐 CORS: Enabled for all origins (testing)`);
  console.log(`📡 Health check: GET /api should return "Hello World!"`);
  console.log('='.repeat(50));
}

bootstrap().catch((error) => {
  console.error('❌ FATAL ERROR - Application failed to start:');
  console.error(error);
  process.exit(1);
});
