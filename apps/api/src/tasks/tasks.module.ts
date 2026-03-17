import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskProcessor } from './task.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'tasks',
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskProcessor],
  exports: [TasksService, BullModule],
})
export class TasksModule {}
