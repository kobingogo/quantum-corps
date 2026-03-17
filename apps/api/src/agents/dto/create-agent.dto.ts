import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiProperty({ example: '调研助手', description: 'Agent 名称' })
  @IsString()
  name: string;

  @ApiProperty({ example: '负责扫描 AI 新闻和行业动态', description: '描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', description: '头像 URL', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'research', description: '部门', enum: ['general', 'research', 'content', 'dev', 'data', 'customer', 'investment', 'marketing', 'operations'] })
  @IsString()
  @IsEnum(['general', 'research', 'content', 'dev', 'data', 'customer', 'investment', 'marketing', 'operations'])
  department: string;

  @ApiProperty({ example: 'gpt-4o', description: '绑定模型', required: false })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiProperty({ example: 100, description: '月度预算（元）', required: false })
  @IsNumber()
  @IsOptional()
  budgetMonthly?: number;
}

export class UpdateAgentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  budgetMonthly?: number;
}
