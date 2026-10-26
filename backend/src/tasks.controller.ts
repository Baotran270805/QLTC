import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list() {
    return this.tasks.list();
  }

  @Post()
  create(@Body() body: { title?: unknown }) {
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 150) {
      throw new BadRequestException('Title phai co tu 1 den 150 ky tu.');
    }
    return this.tasks.create(title);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.tasks.toggle(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasks.remove(id);
  }
}
