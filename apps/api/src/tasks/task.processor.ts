import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TasksService } from '../tasks/tasks.service';
import { AgentsService } from '../agents/agents.service';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';

@Processor('tasks')
export class TaskProcessor {
  private llm: ChatOpenAI;

  constructor(
    private tasksService: TasksService,
    private agentsService: AgentsService,
    private configService: ConfigService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  @Process('execute-task')
  async handleTaskExecution(job: Job) {
    const { taskId } = job.data;

    try {
      // 更新任务状态为运行中
      await this.tasksService.updateStatus(taskId, 'running');
      await this.tasksService.addLog(
        taskId,
        null,
        'info',
        '任务开始执行',
      );

      // 获取任务详情
      const task = await this.tasksService.findOne(taskId, '');
      if (!task) {
        throw new Error('任务不存在');
      }

      // 如果有 Agent，更新 Agent 状态
      if (task.agentId) {
        await this.agentsService.updateStatus(task.agentId, 'busy');
      }

      // 执行任务（根据任务类型调用不同工具）
      const result = await this.executeTaskLogic(task);

      // 记录结果
      await this.tasksService.addLog(
        taskId,
        task.agentId || null,
        'info',
        `任务完成：${result.summary}`,
        { result },
      );

      // 更新任务状态
      await this.tasksService.updateStatus(taskId, 'completed', result);

      // 恢复 Agent 状态
      if (task.agentId) {
        await this.agentsService.updateStatus(task.agentId, 'idle');
      }

    } catch (error) {
      console.error('任务执行失败:', error);
      
      await this.tasksService.addLog(
        taskId,
        null,
        'error',
        `任务失败：${error.message}`,
      );

      await this.tasksService.updateStatus(taskId, 'failed', {
        error: error.message,
      });

      // 恢复 Agent 状态
      const task = await this.tasksService.findOne(taskId, '');
      if (task?.agentId) {
        await this.agentsService.updateStatus(task.agentId, 'idle');
      }

      throw error;
    }
  }

  private async executeTaskLogic(task: any) {
    const { title, description, agent } = task;

    // 根据 Agent 部门执行不同逻辑
    switch (agent?.department) {
      case 'research':
        return await this.executeResearch(task);
      case 'content':
        return await this.executeContent(task);
      case 'data':
        return await this.executeData(task);
      default:
        return await this.executeGeneric(task);
    }
  }

  private async executeResearch(task: any) {
    const prompt = `请调研以下主题，并生成一份简洁的报告：

主题：${task.title}
描述：${task.description || '无'}

要求：
1. 列出 3-5 个关键点
2. 包含最新动态
3. 提供可执行建议

报告：`;

    const response = await this.llm.invoke(prompt);

    return {
      summary: `完成调研：${task.title}`,
      content: response.content,
      type: 'research_report',
    };
  }

  private async executeContent(task: any) {
    const prompt = `请根据以下要求生成内容：

主题：${task.title}
描述：${task.description || '无'}

要求：
1. 内容专业且有价值
2. 结构清晰
3. 适合发布到社交媒体

内容：`;

    const response = await this.llm.invoke(prompt);

    return {
      summary: `生成内容：${task.title}`,
      content: response.content,
      type: 'content',
    };
  }

  private async executeData(task: any) {
    return {
      summary: `数据分析：${task.title}`,
      content: '数据分析功能待实现',
      type: 'data_analysis',
    };
  }

  private async executeGeneric(task: any) {
    const prompt = `请执行以下任务：

任务：${task.title}
描述：${task.description || '无'}

请提供详细的执行结果：`;

    const response = await this.llm.invoke(prompt);

    return {
      summary: `完成任务：${task.title}`,
      content: response.content,
      type: 'generic',
    };
  }
}
