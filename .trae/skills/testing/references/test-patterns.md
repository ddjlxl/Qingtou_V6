# 测试模式参考

> 本文档为 `testing` Skill 的参考附录，提供常见测试模式和示例。

---

## 测试分类

| 类型 | 范围 | 速度 | 编写时机 |
|------|------|------|---------|
| 单元测试 | 单个函数/组件 | 快 | TDD 开发中 |
| 集成测试 | 多个模块协作 | 中 | 模块完成后 |
| E2E 测试 | 完整用户流程 | 慢 | 功能完成后 |

---

## 前端测试模式

### 组件渲染测试
```typescript
it('应正确渲染用户名称', () => {
  const wrapper = mount(UserCard, {
    props: { user: { id: '1', name: '张三', role: 'admin' } }
  })
  expect(wrapper.text()).toContain('张三')
})
```

### 组件交互测试
```typescript
it('点击删除按钮应触发 delete 事件', async () => {
  const wrapper = mount(UserCard, {
    props: { user: { id: '1', name: '张三', role: 'admin' } }
  })
  await wrapper.find('[data-test="delete-btn"]').trigger('click')
  expect(wrapper.emitted('delete')).toBeTruthy()
  expect(wrapper.emitted('delete')?.[0]).toEqual(['1'])
})
```

### 组件状态测试
```typescript
it('加载中应显示骨架屏', () => {
  const wrapper = mount(OrderList, {
    props: { orders: [], isLoading: true, error: null }
  })
  expect(wrapper.find('[data-test="skeleton"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(false)
})

it('数据为空应显示空状态', () => {
  const wrapper = mount(OrderList, {
    props: { orders: [], isLoading: false, error: null }
  })
  expect(wrapper.find('[data-test="empty-state"]').exists()).toBe(true)
})

it('加载失败应显示错误信息', () => {
  const wrapper = mount(OrderList, {
    props: { orders: [], isLoading: false, error: '网络错误' }
  })
  expect(wrapper.find('[data-test="error-state"]').exists()).toBe(true)
  expect(wrapper.text()).toContain('网络错误')
})
```

### Store 测试
```typescript
it('fetchUsers 成功后应更新 users 列表', async () => {
  const store = useUserStore()
  vi.mocked(UserService.getUsers).mockResolvedValue({
    code: 200,
    data: [{ id: '1', name: '张三' }]
  })
  
  await store.fetchUsers()
  
  expect(store.users).toHaveLength(1)
  expect(store.users[0]?.name).toBe('张三')
  expect(store.isLoading).toBe(false)
  expect(store.error).toBeNull()
})

it('fetchUsers 失败后应设置 error', async () => {
  const store = useUserStore()
  vi.mocked(UserService.getUsers).mockRejectedValue(new Error('网络错误'))
  
  await expect(store.fetchUsers()).rejects.toThrow()
  
  expect(store.error).toBe('网络错误')
  expect(store.isLoading).toBe(false)
})
```

---

## 后端测试模式

### API Happy Path
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
```

### API 输入验证
```python
async def test_create_user_empty_name(client):
    """AC-004: 姓名为空时返回 400"""
    response = await client.post("/api/v1/users", json={
        "name": "",
        "email": "test@example.com"
    })
    assert response.status_code == 400
    assert "姓名" in response.json()["message"]
```

### API 认证
```python
async def test_create_user_without_auth(client):
    """未登录时创建用户返回 401"""
    response = await client.post("/api/v1/users", json={
        "name": "张三",
        "email": "zhangsan@example.com"
    })
    assert response.status_code == 401
```

### 数据库验证
```python
async def test_create_user_persists_to_db(client, db_session):
    """创建用户后数据应持久化到数据库"""
    response = await client.post("/api/v1/users", json={
        "name": "张三",
        "email": "zhangsan@example.com"
    })
    user_id = response.json()["data"]["id"]
    
    user = await db_session.get(User, user_id)
    assert user is not None
    assert user.name == "张三"
```

---

## 测试数据管理

### Fixture 模式
```python
@pytest.fixture
async def test_user(db_session):
    user = User(name="测试用户", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    return user

async def test_get_user_success(client, test_user):
    response = await client.get(f"/api/v1/users/{test_user.id}")
    assert response.status_code == 200
```

### Factory 模式
```python
class UserFactory:
    @staticmethod
    async def create(db_session, **kwargs):
        defaults = {"name": "测试用户", "email": "test@example.com"}
        defaults.update(kwargs)
        user = User(**defaults)
        db_session.add(user)
        await db_session.commit()
        return user
```

---

## 测试命名规范

```
describe('UserCard 组件', () => {
  describe('渲染', () => {
    it('应正确显示用户名称和角色')
    it('管理员应显示管理标签')
  })
  
  describe('交互', () => {
    it('点击编辑按钮应触发 edit 事件')
    it('点击删除按钮应弹出确认对话框')
  })
  
  describe('边界情况', () => {
    it('用户名为空时应显示"未命名"')
    it('角色为空时应显示"普通用户"')
  })
})
```
