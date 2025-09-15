// src/lib/logger.ts
const isProduction = process.env.NODE_ENV === 'production'

export const logger = {
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args)
    }
  },
  info: (...args: any[]) => {
    console.log(...args)
  },
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  error: (...args: any[]) => {
    console.error(...args)
  }
}