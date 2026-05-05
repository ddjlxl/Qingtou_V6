export function isPhone(value: string): boolean {
  return /^1[3-9]\d{9}$/.test(value)
}

export function isRequired(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false
  return value.trim().length > 0
}
