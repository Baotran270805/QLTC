import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, TasksController],
  providers: [PrismaService, TasksService],
})
export class AppModule {}
