/**
 * 工具注册中心
 */

export interface Tool {
  name: string;
  description: string;
  category: string;
  inputSchema?: any;
  execute: (input: any) => Promise<any>;
  metadata?: { cost?: number; avgDuration?: number; rateLimit?: number; requiresAuth?: boolean };
}

export const ToolCategories = {
  CODE: 'code', SEARCH: 'search', ANALYSIS: 'analysis',
  COMMUNICATION: 'communication', FILE: 'file', WEB: 'web', DATA: 'data',
} as const;

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private executionLog: any[] = [];

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered: ${tool.name}`);
  }

  registerAll(tools: Tool[]): void { tools.forEach(t => this.register(t)); }
  get(name: string): Tool | undefined { return this.tools.get(name); }
  getAll(): Tool[] { return Array.from(this.tools.values()); }
  getByCategory(category: string): Tool[] { return this.getAll().filter(t => t.category === category); }

  async execute(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    const start = Date.now();
    try {
      const output = await tool.execute(input);
      this.executionLog.push({ tool: name, input, output, duration: Date.now() - start, timestamp: start });
      return output;
    } catch (error: any) {
      this.executionLog.push({ tool: name, input, error: error.message, duration: Date.now() - start, timestamp: start });
      throw error;
    }
  }

  getStats(): any {
    const stats: Record<string, { count: number; totalDuration: number; errors: number }> = {};
    for (const e of this.executionLog) {
      if (!stats[e.tool]) stats[e.tool] = { count: 0, totalDuration: 0, errors: 0 };
      stats[e.tool].count++;
      stats[e.tool].totalDuration += e.duration;
      if (e.error) stats[e.tool].errors++;
    }
    const result: any = {};
    for (const [tool, data] of Object.entries(stats)) {
      result[tool] = { count: data.count, avgDuration: data.totalDuration / data.count, errorRate: data.errors / data.count };
    }
    return result;
  }
}

export const toolRegistry = new ToolRegistry();
