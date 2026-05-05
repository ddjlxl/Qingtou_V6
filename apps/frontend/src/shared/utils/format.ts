export function formatDate(
  value: string | Date,
  pattern = 'yyyy-MM-dd HH:mm:ss'
): string {
  const date = typeof value === 'string' ? new Date(value) : value

  if (isNaN(date.getTime())) {
    return ''
  }

  const pad = (n: number, len = 2) => String(n).padStart(len, '0')

  const map: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  }

  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => map[match])
}

export function formatMoney(amount: number, decimals = 2): string {
  const fixed = amount.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted
}
