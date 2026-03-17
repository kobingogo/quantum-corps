/**
 * 意图分类器 v2.0 - 增强版
 */

export type IntentCategory = 
  | 'code_development'
  | 'code_review'
  | 'bug_fix'
  | 'documentation'
  | 'refactoring'
  | 'testing'
  | 'market_analysis'
  | 'opportunity_scan'
  | 'product_idea'
  | 'investment_research'
  | 'stock_analysis'
  | 'crypto_analysis'
  | 'general_question'
  | 'chitchat';

export interface IntentResult {
  category: IntentCategory;
  confidence: number;
  entities: Record<string, any>;
  suggestedAgent: string;
  suggestedWorkflow: string;
  reasoning: string;
}

interface IntentConfig {
  keywords: string[];
  phrases: string[];
  negativeKeywords: string[];
  agent: string;
  workflow: string;
  priority: number;
}

const INTENT_CONFIG: Record<IntentCategory, IntentConfig> = {
  // ============ 开发军团 ============
  code_development: {
    keywords: [
      '开发', '实现', '编写', '创建', '添加', '构建', '编码', '设计', '架构',  // 添加设计、架构
      'build', 'implement', 'develop', 'create', 'code', 'coding', 'design', 'architecture'
    ],
    phrases: [
      '开发功能', '写代码', '开发一个', '实现功能', '创建项目',
      '设计一个', '系统架构', '架构设计',  // 添加设计相关短语
      'build a', 'create a', 'implement a', 'develop a', 'design a'
    ],
    negativeKeywords: ['文档', 'document', 'readme'],
    agent: 'coder',
    workflow: 'feature-development',
    priority: 10,
  },
  
  code_review: {
    keywords: ['审查', 'review', '检查', '审核', '审视', '安全', '漏洞'],  // 添加安全、漏洞
    phrases: [
      '代码审查', 'code review', '审查代码', '检查代码',
      '安全问题', '安全检查', '安全审查', '检查安全',  // 添加安全相关短语
      'pr review', 'review pr', '审查这个'
    ],
    negativeKeywords: [],
    agent: 'reviewer',
    workflow: 'code-review',
    priority: 9,
  },
  
  bug_fix: {
    keywords: ['修复', 'bug', '报错', '错误', 'fix', 'error', 'issue', '调试', 'debug', '崩溃', '问题'],
    phrases: [
      '修复bug', '修复这个', 'fix bug', 'fix this', '解决错误',
      'debug', '调试一下', '修复问题'
    ],
    negativeKeywords: ['安全', '审查', 'review'],  // 添加负向关键词
    agent: 'coder',
    workflow: 'bug-fix',
    priority: 10,
  },
  
  documentation: {
    keywords: ['文档', 'document', 'readme', '说明', '注释', 'doc', 'wiki'],
    phrases: ['写文档', '更新文档', '生成文档', '添加文档', 'write doc', 'update readme'],
    negativeKeywords: [],
    agent: 'architect',
    workflow: 'documentation',
    priority: 7,
  },
  
  refactoring: {
    keywords: ['重构', '优化', 'refactor', 'optimize', '清理'],
    phrases: ['重构代码', '优化代码', 'refactor code', 'clean up', '改善代码', '代码优化'],
    negativeKeywords: [],
    agent: 'coder',
    workflow: 'refactoring',
    priority: 8,
  },
  
  testing: {
    keywords: ['测试', 'test', '单元测试', 'unit test', '覆盖'],
    phrases: ['写测试', '添加测试', '测试覆盖', '单元测试', 'write test', 'add test', 'test coverage'],
    negativeKeywords: [],
    agent: 'tester',
    workflow: 'testing',
    priority: 8,
  },
  
  // ============ 创业军团 ============
  opportunity_scan: {
    keywords: ['机会', '副业', '赚钱', '商机', '变现', 'opportunity', 'hustle'],
    phrases: ['赚钱机会', '副业机会', '找机会', '有什么机会', '赚钱方法', 'side hustle', 'passive income'],
    negativeKeywords: [],
    agent: 'scout',
    workflow: 'opportunity-scan',
    priority: 8,
  },
  
  product_idea: {
    keywords: ['产品', '创意', '点子', 'idea', 'mvp', '原型', 'startup'],
    phrases: ['产品想法', '做个产品', 'mvp', '产品创意', 'product idea', 'build mvp'],
    negativeKeywords: [],
    agent: 'builder',
    workflow: 'mvp-building',
    priority: 7,
  },
  
  // ============ 投资军团 ============
  market_analysis: {
    keywords: ['市场', '趋势', '竞品', '行业', 'market', 'industry'],
    phrases: ['市场分析', '行业趋势', '竞品分析', 'market analysis', 'industry trend'],
    negativeKeywords: ['股票', 'stock', '币', 'crypto'],
    agent: 'analyst',
    workflow: 'market-analysis',
    priority: 7,
  },
  
  investment_research: {
    keywords: ['投资', '研究', 'portfolio', '资产配置'],
    phrases: ['投资研究', '投资分析', '资产配置', 'investment research', 'portfolio analysis'],
    negativeKeywords: ['股票', 'stock'],
    agent: 'researcher',
    workflow: 'investment-research',
    priority: 7,  // 降低优先级
  },
  
  stock_analysis: {
    keywords: ['股票', 'stock', '选股', '财报', '估值', '股价', 'a股', '美股', '港股'],
    phrases: [
      '分析股票', '这只股票', '股票分析', '选股', '投资价值',  // 添加投资价值
      'stock analysis', 'analyze stock'
    ],
    negativeKeywords: [],
    agent: 'analyst',
    workflow: 'stock-analysis',
    priority: 9,  // 高于 investment_research
  },
  
  crypto_analysis: {
    keywords: ['币', 'crypto', 'bitcoin', 'eth', '以太坊', '比特币', 'defi', 'nft'],
    phrases: ['加密货币', '数字货币', '虚拟币', '区块链', 'crypto analysis', 'analyze crypto'],
    negativeKeywords: [],
    agent: 'analyst',
    workflow: 'crypto-analysis',
    priority: 9,
  },
  
  // ============ 通用 ============
  general_question: {
    keywords: ['什么是', '如何', '为什么', '怎么', '解释', '告诉', 'what', 'how', 'why', 'explain'],
    phrases: ['什么是', '如何做', '为什么', '怎么用', 'what is', 'how to', 'why is'],
    negativeKeywords: [],
    agent: 'nexus',
    workflow: 'general',
    priority: 2,
  },
  
  chitchat: {
    keywords: ['你好', 'hello', 'hi', '谢谢', 'thanks', '早上好', '晚安', 'bye'],
    phrases: [],
    negativeKeywords: [],
    agent: 'nexus',
    workflow: 'chitchat',
    priority: 1,
  },
};

const CORPS_MAP: Record<string, 'work' | 'side-hustle' | 'investment' | 'main'> = {
  coder: 'work', reviewer: 'work', architect: 'work', tester: 'work',
  scout: 'side-hustle', builder: 'side-hustle',
  analyst: 'investment', researcher: 'investment',
  nexus: 'main',
};

export function classifyIntent(text: string): IntentResult {
  const lowerText = text.toLowerCase();
  const scores: Array<{ category: IntentCategory; score: number; matched: string[]; phraseMatched: string[] }> = [];

  for (const [category, config] of Object.entries(INTENT_CONFIG)) {
    const matched: string[] = [];
    const phraseMatched: string[] = [];
    let score = 0;

    for (const phrase of config.phrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        phraseMatched.push(phrase);
        score += config.priority * 2;
      }
    }

    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(keyword);
        score += config.priority;
      }
    }

    let hasNegative = false;
    for (const neg of config.negativeKeywords) {
      if (lowerText.includes(neg.toLowerCase())) {
        hasNegative = true;
        break;
      }
    }

    if (hasNegative) score = Math.floor(score * 0.3);

    if (score > 0) {
      scores.push({ category: category as IntentCategory, score, matched, phraseMatched });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return {
      category: 'general_question',
      confidence: 0.5,
      entities: extractEntities(text, 'general_question'),
      suggestedAgent: 'nexus',
      suggestedWorkflow: 'general',
      reasoning: '无法识别明确意图，默认为一般问题',
    };
  }

  const top = scores[0];
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const confidence = Math.min(top.score / (totalScore || 1), 1);
  const entities = extractEntities(text, top.category);
  const config = INTENT_CONFIG[top.category];
  const reasoning = top.phraseMatched.length > 0
    ? `短语匹配: ${top.phraseMatched.join(', ')}`
    : `关键词匹配: ${top.matched.join(', ')}`;

  return {
    category: top.category,
    confidence,
    entities,
    suggestedAgent: config.agent,
    suggestedWorkflow: config.workflow,
    reasoning,
  };
}

function extractEntities(text: string, category: IntentCategory): Record<string, any> {
  const entities: Record<string, any> = {};

  const techStackPatterns = /\b(react|vue|next\.?js|node\.?js|typescript|javascript|python|go|rust|swift|kotlin|java|spring|django|fastapi|express|tailwind)\b/gi;
  const techMatches = text.match(techStackPatterns);
  if (techMatches) entities.techStack = [...new Set(techMatches.map(t => t.toLowerCase()))];

  if (['stock_analysis', 'investment_research'].includes(category)) {
    const stockPattern = /\b([A-Z]{1,5})\b/g;
    const stockMatches = text.match(stockPattern);
    if (stockMatches) entities.stocks = stockMatches.filter(s => s.length >= 1 && s.length <= 5);
  }

  if (category === 'crypto_analysis') {
    const cryptoPattern = /\b(btc|eth|bitcoin|ethereum|usdt|bnb|sol|ada|xrp|dot|doge)\b/gi;
    const cryptoMatches = text.match(cryptoPattern);
    if (cryptoMatches) entities.cryptos = [...new Set(cryptoMatches.map(c => c.toUpperCase()))];
  }

  const pathPattern = /\/[\w\-\.\/]+/g;
  const pathMatches = text.match(pathPattern);
  if (pathMatches) entities.paths = pathMatches;

  const urlPattern = /https?:\/\/[\w\-\.\/\?\=\&\#\!]+/gi;
  const urlMatches = text.match(urlPattern);
  if (urlMatches) entities.urls = urlMatches;

  const githubPattern = /github\.com\/([\w\-]+)\/([\w\-]+)/gi;
  const githubMatches = [...text.matchAll(githubPattern)];
  if (githubMatches.length > 0) entities.githubRepos = githubMatches.map(m => ({ owner: m[1], repo: m[2] }));

  return entities;
}

export function getIntentCorps(intent: IntentResult): 'work' | 'side-hustle' | 'investment' | 'main' {
  return CORPS_MAP[intent.suggestedAgent] || 'main';
}

export function getIntentPriority(category: IntentCategory): 'urgent' | 'high' | 'medium' | 'low' {
  const priorityMap: Record<IntentCategory, 'urgent' | 'high' | 'medium' | 'low'> = {
    bug_fix: 'urgent',
    code_development: 'high', code_review: 'high', refactoring: 'high', testing: 'high',
    documentation: 'medium', market_analysis: 'medium', opportunity_scan: 'medium',
    product_idea: 'medium', investment_research: 'medium', stock_analysis: 'medium', crypto_analysis: 'medium',
    general_question: 'low', chitchat: 'low',
  };
  return priorityMap[category];
}

export function classifyBatch(texts: string[]): Array<{ text: string; result: IntentResult }> {
  return texts.map(text => ({ text, result: classifyIntent(text) }));
}
