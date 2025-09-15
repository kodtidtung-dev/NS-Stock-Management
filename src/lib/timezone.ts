// src/lib/timezone.ts
/**
 * Timezone utilities for Thailand (Asia/Bangkok)
 */

const THAILAND_TIMEZONE = 'Asia/Bangkok'

/**
 * Get current date in Thailand timezone as YYYY-MM-DD string
 */
export function getCurrentDateThailand(): string {
  const now = new Date()
  const thaiDate = new Date(now.toLocaleString("en-US", { timeZone: THAILAND_TIMEZONE }))

  const year = thaiDate.getFullYear()
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0')
  const day = String(thaiDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Convert a date to Thailand timezone and return as YYYY-MM-DD string
 */
export function toThailandDateString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const thaiDate = new Date(dateObj.toLocaleString("en-US", { timeZone: THAILAND_TIMEZONE }))

  const year = thaiDate.getFullYear()
  const month = String(thaiDate.getMonth() + 1).padStart(2, '0')
  const day = String(thaiDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Get current timestamp in Thailand timezone
 */
export function getCurrentTimestampThailand(): Date {
  const now = new Date()
  return new Date(now.toLocaleString("en-US", { timeZone: THAILAND_TIMEZONE }))
}

/**
 * Format date for display in Thai format
 */
export function formatThaiDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('th-TH', {
    timeZone: THAILAND_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format datetime for display in Thai format
 */
export function formatThaiDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('th-TH', {
    timeZone: THAILAND_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}