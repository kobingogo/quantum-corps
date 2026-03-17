import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAgentDto: CreateAgentDto) {
    return this.prisma.agent.create({
      data: {
        ...createAgentDto,
        userId,
      },
    });
  }

  async findAll(userId: string, department?: string) {
    const where: any = { userId };
    if (department) {
      where.department = department;
    }
    return this.prisma.agent.findMany({
      where,
      include: {
        metrics: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
      include: {
        metrics: true,
        logs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} 不存在`);
    }
    return agent;
  }

  async update(id: string, userId: string, updateAgentDto: UpdateAgentDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} 不存在`);
    }
    return this.prisma.agent.update({
      where: { id },
      data: updateAgentDto,
    });
  }

  async remove(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} 不存在`);
    }
    return this.prisma.agent.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.agent.update({
      where: { id },
      data: { status },
    });
  }
}
