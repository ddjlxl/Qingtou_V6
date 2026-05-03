# TDD 代码示例

> 本文档为 `feature-implementation` Skill 的参考附录，提供各技术层的 TDD 测试代码示例。
> SKILL.md 保持角色设定风格，具体代码模式参见本文档。

---

## 后端测试示例（Python / pytest）

每个 API 端点必须覆盖 Happy Path、Edge Cases、Error Cases、Auth Cases。

```python
async def test_create_user_success(client):
    """AC-001: 创建用户成功"""
    response = await client.post("/api/v1/users", json={
        "name": "张三",
        "email": "zhangsan@example.com"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == 200
    assert data["data"]["name"] == "张三"
    assert "id" in data["data"]

async def test_create_user_invalid_email(client):
    """AC-003: 邮箱格式错误返回 400"""
    response = await client.post("/api/v1/users", json={
        "name": "张三",
        "email": "invalid-email"
    })
    assert response.status_code == 400
    assert "email" in response.json()["message"]
```

---

## 前端组件测试示例（Vitest + Vue Test Utils）

每个组件必须覆盖 Happy Path、Edge Cases、Error Cases、Interaction Cases。

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from './UserCard.vue'

describe('UserCard', () => {
  it('AC-001: 正常渲染用户姓名和头像', () => {
    const wrapper = mount(UserCard, {
      props: { user: { name: '张三', avatar: 'https://...' } }
    })
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('AC-003: 用户名为空时显示"未命名"', () => {
    const wrapper = mount(UserCard, {
      props: { user: { name: '', avatar: '' } }
    })
    expect(wrapper.text()).toContain('未命名')
  })

  it('AC-005: 点击卡片触发 select 事件', async () => {
    const wrapper = mount(UserCard, {
      props: { user: { name: '张三', avatar: '' } }
    })
    await wrapper.find('.user-card').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([{ name: '张三' }])
  })
})
```

---

## Store 测试示例（Vitest + Pinia）

每个 Store 必须覆盖 State Initialization、Happy Path、Edge Cases、Error Cases、Getters、Reset。

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user.store'

describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('AC-001: 初始状态为空数组', () => {
    const store = useUserStore()
    expect(store.users).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('AC-002: fetchUsers 成功后更新状态', async () => {
    const store = useUserStore()
    vi.spyOn(UserService, 'getUsers').mockResolvedValue({
      data: [{ id: 1, name: '张三' }]
    })
    await store.fetchUsers()
    expect(store.users).toHaveLength(1)
    expect(store.users[0].name).toBe('张三')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('AC-003: fetchUsers 失败时设置 error 状态', async () => {
    const store = useUserStore()
    vi.spyOn(UserService, 'getUsers').mockRejectedValue(new Error('网络错误'))
    await expect(store.fetchUsers()).rejects.toThrow('网络错误')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('网络错误')
  })
})
```
