/**
 * DAG 工作流引擎 - 任务依赖图和执行调度
 */

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface DAGNode {
  id: string;
  name: string;
  type: string;
  agent?: string;
  input?: any;
  output?: any;
  status: NodeStatus;
  dependencies: string[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
  retryCount: number;
  maxRetries?: number;
}

export interface DAGWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: Map<string, DAGNode>;
  edges: Array<{ from: string; to: string }>;
  status: NodeStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

class DAGEngine {
  /**
   * 创建工作流 - 使用节点名称作为ID
   */
  createWorkflow(
    name: string,
    nodes: Array<Omit<DAGNode, 'id' | 'status' | 'startedAt' | 'completedAt' | 'error' | 'retryCount'> & { maxRetries?: number }>,
    edges: Array<{ from: string; to: string }>
  ): DAGWorkflow {
    const id = `dag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const nodeMap = new Map<string, DAGNode>();

    // 使用节点名称作为ID，这样边可以正确引用
    for (const node of nodes) {
      const nodeId = node.name; // 关键修改：使用名称作为ID
      nodeMap.set(nodeId, {
        ...node,
        id: nodeId,
        status: 'pending',
        retryCount: 0,
        maxRetries: node.maxRetries ?? 3,
      });
    }

    return {
      id,
      name,
      nodes: nodeMap,
      edges,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  /**
   * 获取可执行的节点（依赖都已满足）
   */
  getExecutableNodes(workflow: DAGWorkflow): DAGNode[] {
    const executable: DAGNode[] = [];

    for (const [nodeId, node] of workflow.nodes) {
      if (node.status !== 'pending') continue;

      // 检查依赖是否都完成
      // dependencies 存储的是节点名称/ID
      const allDepsCompleted = node.dependencies.every(depId => {
        const depNode = workflow.nodes.get(depId);
        return depNode && depNode.status === 'completed';
      });

      if (allDepsCompleted) {
        executable.push(node);
      }
    }

    return executable;
  }

  /**
   * 标记节点开始执行
   */
  startNode(workflow: DAGWorkflow, nodeId: string): void {
    const node = workflow.nodes.get(nodeId);
    if (node) {
      node.status = 'running';
      node.startedAt = Date.now();
    }
  }

  /**
   * 标记节点完成
   */
  completeNode(workflow: DAGWorkflow, nodeId: string, output?: any, error?: string): void {
    const node = workflow.nodes.get(nodeId);
    if (node) {
      node.status = error ? 'failed' : 'completed';
      node.completedAt = Date.now();
      node.output = output;
      node.error = error;
    }

    this.updateWorkflowStatus(workflow);
  }

  /**
   * 更新工作流状态
   */
  private updateWorkflowStatus(workflow: DAGWorkflow): void {
    const nodes = Array.from(workflow.nodes.values());
    const allCompleted = nodes.every(n => n.status === 'completed' || n.status === 'skipped');
    const anyFailed = nodes.some(n => n.status === 'failed');

    if (anyFailed) {
      workflow.status = 'failed';
      workflow.completedAt = Date.now();
    } else if (allCompleted) {
      workflow.status = 'completed';
      workflow.completedAt = Date.now();
    }
  }

  /**
   * 获取工作流进度
   */
  getProgress(workflow: DAGWorkflow): {
    total: number;
    completed: number;
    running: number;
    pending: number;
    failed: number;
    percentage: number;
  } {
    const nodes = Array.from(workflow.nodes.values());
    const total = nodes.length;
    const completed = nodes.filter(n => n.status === 'completed').length;
    const running = nodes.filter(n => n.status === 'running').length;
    const pending = nodes.filter(n => n.status === 'pending').length;
    const failed = nodes.filter(n => n.status === 'failed').length;

    return {
      total,
      completed,
      running,
      pending,
      failed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * 拓扑排序 - 获取执行顺序
   */
  getExecutionOrder(workflow: DAGWorkflow): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected at node: ${nodeId}`);
      }

      visiting.add(nodeId);

      // 先访问依赖
      const node = workflow.nodes.get(nodeId);
      if (node && node.dependencies) {
        for (const depId of node.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // 从所有节点开始
    for (const nodeId of workflow.nodes.keys()) {
      visit(nodeId);
    }

    return order;
  }

  /**
   * 验证工作流
   */
  validate(workflow: DAGWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查循环依赖
    try {
      this.getExecutionOrder(workflow);
    } catch (e: any) {
      errors.push(e.message);
    }

    // 检查依赖节点是否存在
    for (const [nodeId, node] of workflow.nodes) {
      for (const depId of node.dependencies) {
        if (!workflow.nodes.has(depId)) {
          errors.push(`Node "${nodeId}" has invalid dependency: ${depId}`);
        }
      }
    }

    // 检查孤立节点（可选，单节点工作流是合法的）
    if (workflow.nodes.size > 1) {
      const hasNoDeps = Array.from(workflow.nodes.values()).filter(n => n.dependencies.length === 0);
      const allHaveDeps = Array.from(workflow.nodes.values()).every(n => n.dependencies.length > 0);
      if (allHaveDeps && hasNoDeps.length === 0) {
        errors.push('No entry point found (all nodes have dependencies)');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const dagEngine = new DAGEngine();
