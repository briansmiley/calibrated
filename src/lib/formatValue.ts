import { UnitType } from '@/types/database'

/**
 * Format a numeric value with its unit
 */
export function formatValue(
  value: number,
  unitType: UnitType,
  customUnit?: string | null
): string {
  const formattedNumber = value.toLocaleString()

  switch (unitType) {
    case 'currency':
      return `${customUnit || '$'}${formattedNumber}`
    case 'percentage':
      return `${formattedNumber}%`
    case 'custom':
      return customUnit ? `${formattedNumber} ${customUnit}` : formattedNumber
    default:
      return formattedNumber
  }
}

/**
 * Get prefix and suffix for displaying a unit
 */
export function getUnitDisplay(unitType: UnitType, customUnit: string | null): { prefix: string; suffix: string } {
  switch (unitType) {
    case 'currency':
      return { prefix: customUnit || '$', suffix: '' }
    case 'percentage':
      return { prefix: '', suffix: '%' }
    case 'custom':
      return { prefix: '', suffix: customUnit ? ` ${customUnit}` : '' }
    default:
      return { prefix: '', suffix: '' }
  }
}
