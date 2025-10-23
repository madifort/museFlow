/**
 * Logging utility for MuseFlow backend
 * Provides structured logging with different levels and Chrome extension context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.INFO;

  private logs: LogEntry[] = [];

  private maxLogs = 1000;

  /**
   * Set the current log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, { ...context, error });
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): void {
    if (level < this.currentLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console with appropriate method
    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, context);
        break;
    }

    // Store in Chrome storage for debugging (only for errors and warnings)
    if (level >= LogLevel.WARN) {
      this.storeInChromeStorage(entry);
    }
  }

  /**
   * Format a log message for display
   */
  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const time = new Date(entry.timestamp).toLocaleTimeString();
    return `[${time}] [${levelName}] ${entry.message}`;
  }

  /**
   * Store important logs in Chrome storage
   */
  private async storeInChromeStorage(entry: LogEntry): Promise<void> {
    try {
      const result = await chrome.storage.local.get(["logs"]);
      const logs = result.logs || [];

      logs.push(entry);

      // Keep only last 50 entries in storage
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      await chrome.storage.local.set({ logs });
    } catch (error) {
      console.error("Failed to store log in Chrome storage:", error);
    }
  }

  /**
   * Get recent logs
   */
  getLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs from Chrome storage
   */
  async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const result = await chrome.storage.local.get(["logs"]);
      return result.logs || [];
    } catch (error) {
      console.error("Failed to get stored logs:", error);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  async clearStoredLogs(): Promise<void> {
    try {
      await chrome.storage.local.remove(["logs"]);
    } catch (error) {
      console.error("Failed to clear stored logs:", error);
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Initialize logging with configuration
 */
export async function initializeLogging(): Promise<void> {
  try {
    // Try to get log level from storage
    const result = await chrome.storage.sync.get(["logLevel"]);
    if (result.logLevel !== undefined) {
      logger.setLevel(result.logLevel);
    }

    logger.info("Logging initialized", {
      level: LogLevel[logger.getLevel()],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to initialize logging:", error);
  }
}

/**
 * Set log level and persist to storage
 */
export async function setLogLevel(level: LogLevel): Promise<void> {
  logger.setLevel(level);

  try {
    await chrome.storage.sync.set({ logLevel: level });
    logger.info("Log level updated", { newLevel: LogLevel[level] });
  } catch (error) {
    logger.error("Failed to save log level to storage", error);
  }
}
