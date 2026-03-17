import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: '调研 AI 营销工具', description: '任务标题' })
  @IsString()
  title: string;

  @ApiProperty({ example: '帮我调研市面上主流的 AI 营销工具', description: '任务描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'research', description: 'Agent ID', required: false })
  @IsString()
  @IsOptional()
  agentId?: string;

  @ApiProperty({ example: 0, description: '优先级（数字越大优先级越高）', required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiProperty({ example: '2026-03-18T09:00:00Z', description: '计划执行时间', required: false })
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ example: '{}', description: '额外元数据', required: false })
  @IsOptional()
  metadata?: any;
}
