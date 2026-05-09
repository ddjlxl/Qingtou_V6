export interface UserInfo {
  id: string
  username: string
  name: string
  role: string
}

export interface LoginResult {
  token: string
  user: UserInfo
}
