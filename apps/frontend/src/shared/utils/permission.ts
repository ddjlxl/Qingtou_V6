interface UserInfo {
  roles?: string[]
}

function isValidUserInfo(data: unknown): data is UserInfo {
  if (data === null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if ('roles' in obj) {
    return Array.isArray(obj.roles) && obj.roles.every((r) => typeof r === 'string')
  }
  return true
}

function getUser(): UserInfo | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isValidUserInfo(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function hasRole(role: string): boolean {
  const user = getUser()
  return user?.roles?.includes(role) ?? false
}

export function isAdmin(): boolean {
  return hasRole('admin')
}
