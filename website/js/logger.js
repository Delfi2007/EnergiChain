/**
 * Advanced Logging System
 * Multi-level logging with filtering, formatting, and transport
 */

class Logger {
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.level = options.level || 'info';
    this.transports = options.transports || [new ConsoleTransport()];
    this.filters = options.filters || [];
    this.formatters = options.formatters || [new DefaultFormatter()];
    this.context = options.context || {};
    this.enabled = options.enabled !== false;
    this.levels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4,
      fatal: 5
    };
  }

  /**
   * Log trace message
   */
  trace(message, meta = {}) {
    this.log('trace', message, meta);
  }

  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log fatal message
   */
  fatal(message, meta = {}) {
    this.log('fatal', message, meta);
  }

  /**
   * Core log method
   */
  log(level, message, meta = {}) {
    if (!this.enabled) return;
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, meta);

    // Apply filters
    if (!this.applyFilters(entry)) return;

    // Apply formatters
    const formatted = this.applyFormatters(entry);

    // Send to transports
    this.sendToTransports(formatted);
  }

  /**
   * Check if should log at level
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, meta) {
    return {
      timestamp: new Date(),
      level,
      message,
      meta: { ...this.context, ...meta },
      logger: this.name
    };
  }

  /**
   * Apply filters
   */
  applyFilters(entry) {
    for (const filter of this.filters) {
      if (!filter(entry)) return false;
    }
    return true;
  }

  /**
   * Apply formatters
   */
  applyFormatters(entry) {
    let result = entry;
    for (const formatter of this.formatters) {
      result = formatter.format(result);
    }
    return result;
  }

  /**
   * Send to transports
   */
  sendToTransports(entry) {
    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    }
  }

  /**
   * Add transport
   */
  addTransport(transport) {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   */
  removeTransport(transport) {
    const index = this.transports.indexOf(transport);
    if (index !== -1) {
      this.transports.splice(index, 1);
    }
  }

  /**
   * Add filter
   */
  addFilter(filter) {
    this.filters.push(filter);
  }

  /**
   * Add formatter
   */
  addFormatter(formatter) {
    this.formatters.push(formatter);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Create child logger
   */
  child(options = {}) {
    return new Logger({
      name: options.name || this.name,
      level: options.level || this.level,
      transports: [...this.transports],
      filters: [...this.filters],
      formatters: [...this.formatters],
      context: { ...this.context, ...options.context }
    });
  }
}

/**
 * Console Transport
 */
class ConsoleTransport {
  constructor(options = {}) {
    this.colors = options.colors !== false;
    this.colorMap = {
      trace: '\x1b[37m',
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      fatal: '\x1b[35m',
      reset: '\x1b[0m'
    };
  }

  /**
   * Log to console
   */
  log(entry) {
    const method = this.getConsoleMethod(entry.level);
    const color = this.colors ? this.colorMap[entry.level] : '';
    const reset = this.colors ? this.colorMap.reset : '';
    
    if (typeof entry === 'string') {
      console[method](`${color}${entry}${reset}`);
    } else {
      console[method](`${color}${entry.message}${reset}`, entry.meta);
    }
  }

  /**
   * Get console method
   */
  getConsoleMethod(level) {
    const methods = {
      trace: 'debug',
      debug: 'debug',
      info: 'info',
      warn: 'warn',
      error: 'error',
      fatal: 'error'
    };
    return methods[level] || 'log';
  }
}

/**
 * File Transport (requires backend support)
 */
class FileTransport {
  constructor(options = {}) {
    this.filename = options.filename || 'app.log';
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.endpoint = options.endpoint || '/api/logs';
  }

  /**
   * Log to file (via API)
   */
  async log(entry) {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: this.filename,
          entry: typeof entry === 'string' ? entry : JSON.stringify(entry)
        })
      });
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }
}

/**
 * HTTP Transport
 */
class HTTPTransport {
  constructor(options = {}) {
    this.url = options.url;
    this.method = options.method || 'POST';
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.batchSize = options.batchSize || 10;
    this.batchInterval = options.batchInterval || 5000;
    this.batch = [];
    this.timer = null;
  }

  /**
   * Log via HTTP
   */
  log(entry) {
    this.batch.push(entry);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchInterval);
    }
  }

  /**
   * Flush batch
   */
  async flush() {
    if (this.batch.length === 0) return;

    const logs = [...this.batch];
    this.batch = [];
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    try {
      await fetch(this.url, {
        method: this.method,
        headers: this.headers,
        body: JSON.stringify(logs)
      });
    } catch (error) {
      console.error('Failed to send logs via HTTP:', error);
    }
  }
}

/**
 * LocalStorage Transport
 */
class LocalStorageTransport {
  constructor(options = {}) {
    this.key = options.key || 'logs';
    this.maxEntries = options.maxEntries || 1000;
  }

  /**
   * Log to localStorage
   */
  log(entry) {
    try {
      const logs = this.getLogs();
      logs.push(typeof entry === 'string' ? entry : JSON.stringify(entry));

      if (logs.length > this.maxEntries) {
        logs.splice(0, logs.length - this.maxEntries);
      }

      localStorage.setItem(this.key, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to write log to localStorage:', error);
    }
  }

  /**
   * Get logs
   */
  getLogs() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear logs
   */
  clear() {
    localStorage.removeItem(this.key);
  }
}

/**
 * Default Formatter
 */
class DefaultFormatter {
  format(entry) {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const message = entry.message;
    const meta = Object.keys(entry.meta).length > 0 ? JSON.stringify(entry.meta) : '';
    
    return `[${timestamp}] ${level} [${entry.logger}]: ${message} ${meta}`.trim();
  }
}

/**
 * JSON Formatter
 */
class JSONFormatter {
  format(entry) {
    return JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      logger: entry.logger,
      message: entry.message,
      meta: entry.meta
    });
  }
}

/**
 * Pretty Formatter
 */
class PrettyFormatter {
  constructor(options = {}) {
    this.colors = options.colors !== false;
    this.icons = {
      trace: '🔍',
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💀'
    };
  }

  format(entry) {
    const icon = this.icons[entry.level] || '';
    const timestamp = this.formatTime(entry.timestamp);
    const level = entry.level.toUpperCase().padEnd(5);
    const logger = `[${entry.logger}]`.padEnd(15);
    
    let result = `${icon} ${timestamp} ${level} ${logger} ${entry.message}`;
    
    if (Object.keys(entry.meta).length > 0) {
      result += `\n${JSON.stringify(entry.meta, null, 2)}`;
    }
    
    return result;
  }

  formatTime(date) {
    return date.toTimeString().split(' ')[0];
  }
}

/**
 * Performance Logger
 */
class PerformanceLogger extends Logger {
  constructor(options = {}) {
    super(options);
    this.timers = new Map();
  }

  /**
   * Start timer
   */
  time(label) {
    this.timers.set(label, performance.now());
  }

  /**
   * End timer
   */
  timeEnd(label) {
    if (!this.timers.has(label)) {
      this.warn(`Timer "${label}" does not exist`);
      return;
    }

    const start = this.timers.get(label);
    const duration = performance.now() - start;
    this.timers.delete(label);

    this.info(`${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Measure function execution
   */
  async measure(label, fn) {
    this.time(label);
    try {
      const result = await fn();
      this.timeEnd(label);
      return result;
    } catch (error) {
      this.timeEnd(label);
      throw error;
    }
  }
}

/**
 * Error Logger with stack trace
 */
class ErrorLogger extends Logger {
  /**
   * Log error with stack trace
   */
  logError(error, context = {}) {
    const meta = {
      ...context,
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      cause: error.cause
    };

    this.error('Exception occurred', meta);
  }

  /**
   * Log unhandled rejection
   */
  logUnhandledRejection(reason, promise) {
    this.error('Unhandled Promise Rejection', {
      reason: reason?.toString(),
      stack: reason?.stack,
      promise: promise?.toString()
    });
  }

  /**
   * Log uncaught exception
   */
  logUncaughtException(error) {
    this.fatal('Uncaught Exception', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logUncaughtException(event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.logUnhandledRejection(event.reason, event.promise);
      });
    }
  }
}

/**
 * Log Manager
 */
class LogManager {
  constructor() {
    this.loggers = new Map();
    this.defaultConfig = {
      level: 'info',
      transports: [new ConsoleTransport()],
      formatters: [new DefaultFormatter()]
    };
  }

  /**
   * Get or create logger
   */
  getLogger(name, options = {}) {
    if (this.loggers.has(name)) {
      return this.loggers.get(name);
    }

    const logger = new Logger({
      name,
      ...this.defaultConfig,
      ...options
    });

    this.loggers.set(name, logger);
    return logger;
  }

  /**
   * Set default config
   */
  setDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Set level for all loggers
   */
  setLevel(level) {
    this.loggers.forEach(logger => logger.setLevel(level));
  }

  /**
   * Enable all loggers
   */
  enableAll() {
    this.loggers.forEach(logger => logger.enable());
  }

  /**
   * Disable all loggers
   */
  disableAll() {
    this.loggers.forEach(logger => logger.disable());
  }
}

// Create global instances
const logManager = new LogManager();
const logger = logManager.getLogger('default');

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Logger,
    ConsoleTransport,
    FileTransport,
    HTTPTransport,
    LocalStorageTransport,
    DefaultFormatter,
    JSONFormatter,
    PrettyFormatter,
    PerformanceLogger,
    ErrorLogger,
    LogManager,
    logManager,
    logger
  };
}
