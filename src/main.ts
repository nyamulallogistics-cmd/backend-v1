import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Define allowed CORS origins
  const allowedOrigins = [
    'https://nyamula-logistics-landing.vercel.app',
    'https://www.nyamula.com',
    'https://nyamula.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
  ];

  // Helper function to check if origin is allowed
  const isAllowedOrigin = (origin?: string): boolean => {
    if (!origin) return true; // Allow requests with no origin (Postman, mobile apps)
    if (allowedOrigins.includes(origin)) return true;
    
    // Allow any localhost in development
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return true;
    }
    
    return false;
  };

  // Enable CORS with dynamic origin validation
  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.log(`❌ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  });

  // Explicit CORS headers middleware (helps with proxies like Railway)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    console.log(`📥 ${req.method} ${req.url} from ${origin || 'no-origin'}`);
    
    if (origin && isAllowedOrigin(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    }
    
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      console.log('✅ Responding to OPTIONS preflight');
      return res.sendStatus(204);
    }
    
    next();
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

  // Additional catch-all OPTIONS handler (in case Railway strips prefixes)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin;
      if (origin && isAllowedOrigin(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      console.log('🔄 Final OPTIONS catch-all triggered');
      return res.sendStatus(204);
    }
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Railway

  const environment = process.env.NODE_ENV || 'development';
  console.log('='.repeat(60));
  console.log(`🚀 Nyamula Logistics Backend running on http://0.0.0.0:${port}`);
  console.log(`📝 Environment: ${environment}`);
  console.log(`🔐 CORS enabled for:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`🌐 Server binding: 0.0.0.0:${port}`);
  console.log(`📡 Waiting for requests...`);
  console.log('='.repeat(60));
}
bootstrap();
