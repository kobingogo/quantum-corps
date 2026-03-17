/**
 * 日志系统
 */

import fs from 'fs/promises';
import path from 'path';

export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3, FATAL = 4 }

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: any;
  error?: any;
}

class Logger {
  private level: LogLevel;
  private context: string;
  private logDir: string;

  constructor(context: string = 'app', level: LogLevel = LogLevel.INFO, logDir: string = '/Users/bingo/openclaw_all/logs') {
    this.context = context;
    this.level = level;
    this.logDir = logDir;
  }

  child(context: string): Logger { return new Logger(`${this.context}:${context}`, this.level, this.logDir); }
  debug(msg: string, data?: any): void { this.log(LogLevel.DEBUG, msg, data); }
  info(msg: string, data?: any): void { this.log(LogLevel.INFO, msg, data); }
  warn(msg: string, data?: any): void { this.log(LogLevel.WARN, msg, data); }
  error(msg: string, err?: any, data?: any): void { this.log(LogLevel.ERROR, msg, { ...data, error: err }); }
  fatal(msg: string, err?: any, data?: any): void { this.log(LogLevel.FATAL, msg, { ...data, error: err }); }

  private async log(level: LogLevel, message: string, data?: any): Promise<void> {
    if (level < this.level) return;
    const entry: LogEntry = { timestamp: new Date().toISOString(), level: LogLevel[level], message, context: this.context, data };
    const colors: Record<string, string> = { DEBUG: '\x1b[36m', INFO: '\x1b[32m', WARN: '\x1b[33m', ERROR: '\x1b[31m', FATAL: '\x1b[35m' };
    const output = `${colors[entry.level]}${entry.level}\x1b[0m [${this.context}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
    console.log(output);
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      await fs.appendFile(path.join(this.logDir, `${this.context.split(':')[0]}.log`), JSON.stringify(entry) + '\n');
    } catch (e) {}
  }
}

export const logger = new Logger('orchestrator');
export const createLogger = (ctx: string): Logger => logger.child(ctx);
