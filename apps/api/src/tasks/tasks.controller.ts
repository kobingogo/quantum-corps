import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('任务管理')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  findAll(@Request() req, @Query('status') status?: string) {
    return this.tasksService.findAll(req.user.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消任务' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.tasksService.cancel(id, req.user.userId);
  }
}
