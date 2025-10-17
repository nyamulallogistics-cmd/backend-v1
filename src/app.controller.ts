import { Controller, Get, Post, HttpCode, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('cors-test')
  @HttpCode(200)
  corsTest(@Req() req: any) {
    return {
      message: 'CORS is working!',
      origin: req.headers.origin,
      method: req.method,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cors-test')
  @HttpCode(200)
  corsTestPost(@Req() req: any) {
    return {
      message: 'CORS POST is working!',
      origin: req.headers.origin,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString(),
    };
  }
}
