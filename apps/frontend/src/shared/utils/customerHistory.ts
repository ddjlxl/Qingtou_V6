const CUSTOMER_HISTORY_KEY = 'customer_history'

export function getCustomerHistory(): string[] {
  const data = localStorage.getItem(CUSTOMER_HISTORY_KEY)
  return data ? JSON.parse(data) : []
}

export function saveCustomerHistory(name: string): void {
  if (!name?.trim()) return
  const list = getCustomerHistory()
  const updated = [name.trim(), ...list.filter((n) => n !== name.trim())].slice(0, 20)
  localStorage.setItem(CUSTOMER_HISTORY_KEY, JSON.stringify(updated))
}
