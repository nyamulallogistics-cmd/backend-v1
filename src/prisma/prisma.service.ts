import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('🔌 Connecting to database...');
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // Use process hook to ensure proper shutdown without Prisma type issues
    process.on('beforeExit', async () => {
      this.logger.log('Closing database connection...');
      await app.close();
    });
  }
}


