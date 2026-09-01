import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get(['', 'api/v1'])
  @Head(['', 'api/v1'])
  @Public()
  @HttpCode(HttpStatus.OK)
  getRoot() {
    return {
      status: 'ok',
      service: 'fmea-backend',
      version: '0.5.7',
      timestamp: new Date().toISOString(),
    };
  }

  getHello(): string {
    return this.appService.getHello();
  }

  @Get(['health', 'api/v1/health'])
  @Head(['health', 'api/v1/health'])
  @Public()
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
