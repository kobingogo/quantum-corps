import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/create-agent.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Agent 管理')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: '创建 Agent' })
  create(@Request() req, @Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(req.user.userId, createAgentDto);
  }

  @Get()
  @ApiOperation({ summary: '获取 Agent 列表' })
  findAll(@Request() req, @Query('department') department?: string) {
    return this.agentsService.findAll(req.user.userId, department);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取 Agent 详情' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.agentsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新 Agent' })
  update(@Request() req, @Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentsService.update(id, req.user.userId, updateAgentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 Agent' })
  remove(@Request() req, @Param('id') id: string) {
    return this.agentsService.remove(id, req.user.userId);
  }
}
