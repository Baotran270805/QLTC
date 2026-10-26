import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('api')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', backend: 'NestJS', database: 'MySQL connected' };
  }
}
