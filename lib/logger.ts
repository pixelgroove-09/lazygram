type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
const enableConsoleLogs = process.env.ENABLE_CONSOLE_LOGS === "true"

export const logger = {
  debug: (message: string, meta?: any) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.debug && enableConsoleLogs) {
      console.debug(`[DEBUG] ${message}`, meta)
    }
  },

  info: (message: string, meta?: any) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.info && enableConsoleLogs) {
      console.info(`[INFO] ${message}`, meta)
    }
  },

  warn: (message: string, meta?: any) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.warn && enableConsoleLogs) {
      console.warn(`[WARN] ${message}`, meta)
    }
  },

  error: (message: string, error?: any) => {
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS.error && enableConsoleLogs) {
      console.error(`[ERROR] ${message}`, error)
    }
  },
}

