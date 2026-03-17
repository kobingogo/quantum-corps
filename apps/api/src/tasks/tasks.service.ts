import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('tasks') private tasksQueue: Queue,
    private eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        userId,
        status: 'pending',
      },
      include: {
        agent: true,
      },
    });

    // 添加到任务队列
    await this.tasksQueue.add(
      'execute-task',
      { taskId: task.id },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    // 推送事件
    this.eventsGateway.server.emit('task:created', task);

    return task;
  }

  async findAll(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }
    return this.prisma.task.findMany({
      where,
      include: {
        agent: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      include: {
        agent: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    return task;
  }

  async updateStatus(taskId: string, status: string, result?: any) {
    const update: any = { status };
    if (status === 'completed' || status === 'failed') {
      update.completedAt = new Date();
    }
    if (status === 'running') {
      update.startedAt = new Date();
    }
    if (result) {
      update.result = result;
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: update,
      include: { agent: true },
    });

    // 推送事件
    this.eventsGateway.server.emit(`task:${status}`, task);

    return task;
  }

  async addLog(taskId: string, agentId: string | null, level: string, message: string, metadata?: any) {
    const log = await this.prisma.taskLog.create({
      data: {
        taskId,
        agentId,
        level,
        message,
        metadata,
      },
      include: {
        agent: true,
      },
    });

    // 推送事件
    this.eventsGateway.server.emit('task:log', log);

    return log;
  }

  async cancel(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) {
      throw new Error('任务不存在');
    }
    if (task.status === 'completed' || task.status === 'failed') {
      throw new Error('任务已完成，无法取消');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: 'cancelled', completedAt: new Date() },
    });
  }
}
