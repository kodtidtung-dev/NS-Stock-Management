// src/lib/fractions.ts
export interface FractionResult {
  value: number
  isValid: boolean
  error?: string
}

/**
 * Parse fraction or decimal input and return numeric value
 * Supports: "1/4", "3/4", "1 1/2", "0.25", "2.5", etc.
 */
export function parseFraction(input: string): FractionResult {
  if (!input || input.trim() === '') {
    return { value: 0, isValid: false, error: 'กรุณากรอกตัวเลข' }
  }

  const trimmed = input.trim()

  // Handle decimal numbers (0.25, 2.5, etc.)
  if (!trimmed.includes('/')) {
    const num = parseFloat(trimmed)
    if (isNaN(num)) {
      return { value: 0, isValid: false, error: 'รูปแบบตัวเลขไม่ถูกต้อง' }
    }
    if (num < 0) {
      return { value: 0, isValid: false, error: 'ตัวเลขต้องมากกว่าหรือเท่ากับ 0' }
    }
    return { value: num, isValid: true }
  }

  // Handle mixed numbers (1 1/2, 2 3/4, etc.)
  if (trimmed.includes(' ') && trimmed.includes('/')) {
    const parts = trimmed.split(' ')
    if (parts.length !== 2) {
      return { value: 0, isValid: false, error: 'รูปแบบเศษส่วนผสมไม่ถูกต้อง (เช่น 1 1/2)' }
    }

    const wholePart = parseFloat(parts[0])
    if (isNaN(wholePart) || wholePart < 0) {
      return { value: 0, isValid: false, error: 'ส่วนจำนวนเต็มไม่ถูกต้อง' }
    }

    const fractionResult = parseFraction(parts[1])
    if (!fractionResult.isValid) {
      return fractionResult
    }

    return { value: wholePart + fractionResult.value, isValid: true }
  }

  // Handle simple fractions (1/4, 3/4, etc.)
  const fractionParts = trimmed.split('/')
  if (fractionParts.length !== 2) {
    return { value: 0, isValid: false, error: 'รูปแบบเศษส่วนไม่ถูกต้อง (เช่น 1/4)' }
  }

  const numerator = parseInt(fractionParts[0].trim())
  const denominator = parseInt(fractionParts[1].trim())

  if (isNaN(numerator) || isNaN(denominator)) {
    return { value: 0, isValid: false, error: 'ตัวเศษหรือตัวส่วนไม่ใช่ตัวเลข' }
  }

  if (denominator === 0) {
    return { value: 0, isValid: false, error: 'ตัวส่วนไม่สามารถเป็น 0 ได้' }
  }

  if (numerator < 0 || denominator < 0) {
    return { value: 0, isValid: false, error: 'เศษส่วนต้องเป็นจำนวนบวก' }
  }

  const result = numerator / denominator
  return { value: result, isValid: true }
}

/**
 * Convert decimal number to fraction display
 * 0.25 → "1/4", 0.5 → "1/2", 0.75 → "3/4", etc.
 */
export function formatAsFraction(value: number, maxDenominator: number = 32): string {
  if (value === 0) return '0'
  if (value === Math.floor(value)) return value.toString()

  // Handle mixed numbers
  const wholePart = Math.floor(value)
  const fractionalPart = value - wholePart

  // Find the best fraction representation
  const fraction = decimalToFraction(fractionalPart, maxDenominator)

  if (fraction.denominator === 1) {
    return (wholePart + fraction.numerator).toString()
  }

  if (wholePart === 0) {
    return `${fraction.numerator}/${fraction.denominator}`
  }

  return `${wholePart} ${fraction.numerator}/${fraction.denominator}`
}

/**
 * Convert decimal to fraction using continued fractions algorithm
 */
function decimalToFraction(decimal: number, maxDenominator: number = 32): { numerator: number, denominator: number } {
  if (decimal === 0) return { numerator: 0, denominator: 1 }

  // Common fractions lookup for better UX
  const commonFractions: { [key: string]: { numerator: number, denominator: number } } = {
    '0.25': { numerator: 1, denominator: 4 },
    '0.5': { numerator: 1, denominator: 2 },
    '0.75': { numerator: 3, denominator: 4 },
    '0.125': { numerator: 1, denominator: 8 },
    '0.375': { numerator: 3, denominator: 8 },
    '0.625': { numerator: 5, denominator: 8 },
    '0.875': { numerator: 7, denominator: 8 },
    '0.33333333': { numerator: 1, denominator: 3 },
    '0.66666667': { numerator: 2, denominator: 3 },
  }

  const rounded = parseFloat(decimal.toFixed(8))
  const key = rounded.toString()
  if (commonFractions[key]) {
    return commonFractions[key]
  }

  // Continued fractions algorithm
  let h1 = 1, h2 = 0
  let k1 = 0, k2 = 1
  let x = decimal

  while (k1 <= maxDenominator) {
    const a = Math.floor(x)
    const h = a * h1 + h2
    const k = a * k1 + k2

    if (k > maxDenominator) break

    if (Math.abs(decimal - h / k) < 0.0001) {
      return { numerator: h, denominator: k }
    }

    x = 1 / (x - a)
    h2 = h1; h1 = h
    k2 = k1; k1 = k
  }

  // Fallback to simple approximation
  const denominator = Math.min(maxDenominator, Math.pow(10, decimal.toString().split('.')[1]?.length || 0))
  const numerator = Math.round(decimal * denominator)
  return { numerator, denominator }
}

/**
 * Smart display formatting - shows fraction for common values, decimal otherwise
 */
export function smartFormat(value: number): string {
  if (value === 0) return '0'
  if (value === Math.floor(value)) return value.toString()

  // For small fractions, prefer fraction display
  if (value < 1) {
    const fraction = decimalToFraction(value)
    if (fraction.denominator <= 8) {
      return `${fraction.numerator}/${fraction.denominator}`
    }
  }

  // For mixed numbers with simple fractions
  const wholePart = Math.floor(value)
  const fractionalPart = value - wholePart

  if (fractionalPart > 0) {
    const fraction = decimalToFraction(fractionalPart)
    if (fraction.denominator <= 8) {
      if (wholePart === 0) {
        return `${fraction.numerator}/${fraction.denominator}`
      }
      return `${wholePart} ${fraction.numerator}/${fraction.denominator}`
    }
  }

  // Default to decimal with reasonable precision
  return value.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * Input validation for fraction/decimal inputs
 */
export function validateNumberInput(input: string): { isValid: boolean, error?: string } {
  const result = parseFraction(input)
  return { isValid: result.isValid, error: result.error }
}

/**
 * Helper to format display with unit
 */
export function formatWithUnit(value: number, unit: string, useSmartFormat: boolean = true): string {
  const formatted = useSmartFormat ? smartFormat(value) : value.toString()
  return `${formatted} ${unit}`
}