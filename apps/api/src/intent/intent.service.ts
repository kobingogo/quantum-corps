import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

const TaskSchema = z.object({
  intent: z.string().describe('任务意图：create_task, create_scheduled_task, query_status, cancel_task'),
  entities: z.object({
    action: z.string().optional().describe('具体动作'),
    topic: z.string().optional().describe('主题'),
    schedule: z.string().optional().describe('Cron 表达式或自然语言时间'),
    output: z.string().optional().describe('输出格式'),
    delivery: z.object({
      channel: z.string().optional(),
      target: z.string().optional(),
    }).optional(),
  }),
  agentSuggestion: z.string().optional().describe('推荐的 Agent 部门'),
  confidence: z.number().describe('置信度 0-1'),
});

@Injectable()
export class IntentService {
  private llm: ChatOpenAI;
  private prompt: PromptTemplate;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.1,
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });

    this.prompt = PromptTemplate.fromTemplate(`
你是一个 AI 军团任务解析助手。将用户的自然语言输入解析为结构化任务。

可用部门：research(调研), content(内容), dev(开发), data(数据), customer(客服), investment(投资), marketing(营销), operations(运营)

可用意图：
- create_task: 立即执行任务
- create_scheduled_task: 定时任务
- query_status: 查询状态
- cancel_task: 取消任务

示例 1:
输入："帮我调研 AI 营销工具"
输出：{{"intent": "create_task", "entities": {{"action": "research", "topic": "AI 营销工具"}}, "agentSuggestion": "research", "confidence": 0.95}}

示例 2:
输入："每天早上 9 点，扫描 AI 新闻，生成简报发我飞书"
输出：{{"intent": "create_scheduled_task", "entities": {{"action": "scan", "topic": "AI 新闻", "schedule": "0 9 * * *", "output": "简报", "delivery": {{"channel": "feishu", "target": "user"}}}}, "agentSuggestion": "research", "confidence": 0.92}}

用户输入：{input}

解析结果（JSON 格式）：
`);
  }

  async parseIntent(input: string) {
    try {
      const formattedPrompt = await this.prompt.format({ input });
      const response = await this.llm.invoke(formattedPrompt);
      const content = response.content as string;
      
      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析响应');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = TaskSchema.parse(parsed);

      return {
        success: true,
        data: validated,
        rawInput: input,
      };
    } catch (error) {
      console.error('意图解析失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '解析失败',
        rawInput: input,
      };
    }
  }

  async suggestAgent(department: string, userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: {
        userId,
        department,
        status: 'idle',
      },
      take: 1,
    });

    if (agents.length > 0) {
      return agents[0].id;
    }

    // 如果没有空闲 Agent，返回该部门的任意 Agent
    const anyAgent = await this.prisma.agent.findFirst({
      where: {
        userId,
        department,
      },
    });

    return anyAgent?.id || null;
  }

  parseSchedule(scheduleText: string): string | null {
    // 简单的 Cron 表达式生成
    const patterns: Record<string, string> = {
      '每天早上': '0 9 * * *',
      '每天晚上': '0 20 * * *',
      '每周一': '0 9 * * 1',
      '每周五': '0 9 * * 5',
      '每小时': '0 * * * *',
      '每 30 分钟': '*/30 * * * *',
    };

    for (const [key, cron] of Object.entries(patterns)) {
      if (scheduleText.includes(key)) {
        return cron;
      }
    }

    return null;
  }
}
