type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  if (import.meta.env.PROD) {
    return LOG_LEVELS[level] >= LOG_LEVELS.warn
  }
  return true
}

function formatMessage(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return

  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${message}`, data)
  } else {
    // eslint-disable-next-line no-console
    console[level](`${prefix} ${message}`)
  }
}

export const logger = {
  debug(message: string, data?: unknown) {
    formatMessage('debug', message, data)
  },
  info(message: string, data?: unknown) {
    formatMessage('info', message, data)
  },
  warn(message: string, data?: unknown) {
    formatMessage('warn', message, data)
  },
  error(message: string, data?: unknown) {
    formatMessage('error', message, data)
  },
}
