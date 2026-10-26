import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.task.findMany({ orderBy: { id: 'desc' } });
  }

  create(title: string) {
    return this.prisma.task.create({ data: { title } });
  }

  async toggle(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Khong tim thay cong viec.');
    return this.prisma.task.update({ where: { id }, data: { completed: !task.completed } });
  }

  async remove(id: number) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Khong tim thay cong viec.');
    await this.prisma.task.delete({ where: { id } });
    return { deleted: true, id };
  }
}
