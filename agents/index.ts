/**
 * Agent 注册中心
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

const AGENTS_DIR = '/Users/bingo/openclaw_all/agents';

export interface AgentConfig {
  id: string;
  name: string;
  type: 'work' | 'side-hustle' | 'investment';
  role: string;
  description: string;
  capabilities: string[];
  skills: string[];
  personality: {
    tone: string;
    style: string;
    focus: string;
  };
  execution: {
    runtime: 'acp' | 'subagent';
    agentId?: string;
    timeout: number;
    maxRetries: number;
  };
  triggers: string[];
  examples: Array<{ input: string; output: string }>;
}

class AgentRegistry {
  private agents: Map<string, AgentConfig> = new Map();
  private loaded = false;

  /**
   * 加载所有 Agent 配置
   */
  async load(): Promise<void> {
    if (this.loaded) return;

    const corps = ['work', 'side-hustle', 'investment'];

    for (const corp of corps) {
      const corpPath = path.join(AGENTS_DIR, corp);
      try {
        const agents = await fs.readdir(corpPath);
        for (const agentDir of agents) {
          const configPath = path.join(corpPath, agentDir, 'agent.yaml');
          try {
            const content = await fs.readFile(configPath, 'utf-8');
            const config = yaml.parse(content) as AgentConfig;
            this.agents.set(config.id, config);
            console.log(`[AgentRegistry] Loaded: ${config.id} (${corp})`);
          } catch (e) {
            // 配置文件不存在，跳过
          }
        }
      } catch (e) {
        // 目录不存在，跳过
      }
    }

    this.loaded = true;
  }

  /**
   * 获取 Agent 配置
   */
  get(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  /**
   * 获取所有 Agent
   */
  getAll(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * 按军团获取
   */
  getByType(type: 'work' | 'side-hustle' | 'investment'): AgentConfig[] {
    return this.getAll().filter(a => a.type === type);
  }

  /**
   * 根据触发词匹配 Agent
   */
  matchByTrigger(text: string): AgentConfig | undefined {
    const lowerText = text.toLowerCase();
    
    for (const agent of this.agents.values()) {
      for (const trigger of agent.triggers) {
        if (lowerText.includes(trigger.toLowerCase())) {
          return agent;
        }
      }
    }

    return undefined;
  }

  /**
   * 获取 Agent 提示词
   */
  async getPrompt(agentId: string, promptType: 'system' | 'user' = 'system'): Promise<string | null> {
    const agent = this.get(agentId);
    if (!agent) return null;

    const corps = ['work', 'side-hustle', 'investment'];
    for (const corp of corps) {
      const promptPath = path.join(AGENTS_DIR, corp, agentId, 'prompts', `${promptType}.md`);
      try {
        return await fs.readFile(promptPath, 'utf-8');
      } catch (e) {
        // 继续尝试
      }
    }

    return null;
  }
}

export const agentRegistry = new AgentRegistry();
