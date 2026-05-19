# SQLite → PostgreSQL 迁移踩坑总结

> **日期**：2026-05-18
> **背景**：V6 项目数据库从 SQLite 迁移到 PostgreSQL，测试框架从完全不可用到 233 测试全部通过

---

## 一、外键约束：从"摆设"变"铁律"

### 现象

测试中大量使用 `dispatcher_id = uuid.uuid4()` 生成随机 ID 插入 orders 表，SQLite 下没问题，PostgreSQL 直接报错：

```
ForeignKeyViolationError: 插入或更新表 "orders" 违反外键约束 "orders_dispatcher_id_fkey"
DETAIL: 键值对(dispatcher_id)=(xxxx)没有在表"users"中出现
```

### 原因

SQLite 默认不强制外键约束（需要手动 `PRAGMA foreign_keys = ON`），所以随便插不存在的关联 ID 不会报错。PostgreSQL 默认强制外键，插入不存在的关联 ID 直接拒绝。

### 规则

测试中任何引用 `users` 表的外键字段（`dispatcher_id`、`user_id` 等），必须先在 `users` 表中创建对应记录，不能凭空造 UUID。

```python
# ❌ 禁止
dispatcher_id = uuid.uuid4()
await create_order(db_session, data, dispatcher_id)

# ✅ 正确
dispatcher = await create_test_user(db_session, "test_dispatcher")
dispatcher_id = dispatcher.id
await create_order(db_session, data, dispatcher_id)
```

### 修复方式

在 `create_test_order` 辅助函数中增加 `_ensure_dispatcher`，自动检查并创建缺失的用户记录：

```python
async def _ensure_dispatcher(db_session, dispatcher_id: uuid.UUID):
    result = await db_session.execute(select(User).where(User.id == dispatcher_id))
    if result.scalar_one_or_none() is None:
        user = User(
            id=dispatcher_id,
            username=f"dispatcher_{dispatcher_id.hex[:8]}",
            password="$2b$12$placeholder",
            name=f"dispatcher_{dispatcher_id.hex[:8]}",
            role="dispatcher",
            status="active",
        )
        db_session.add(user)
        await db_session.commit()
```

---

## 二、passlib + bcrypt 版本死锁

### 现象

测试运行后卡在 `await db_session.commit()` 上，无任何输出，进程挂死，必须手动终止。

### 原因

`passlib 1.7.4` 内部通过 `bcrypt.__about__.__version__` 检测版本，而 `bcrypt 4.x` 移除了 `__about__` 模块，导致 passlib 进入无限递归/死循环。这不是数据库问题，而是密码哈希库的兼容性问题。

### 规则

直接使用 `bcrypt` 库，不经过 `passlib`。密码哈希/验证只需要两行代码，不需要额外封装层。

```python
# ❌ 禁止：passlib 封装
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ 正确：直接用 bcrypt
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

---

## 三、pytest-asyncio 事件循环冲突

### 现象

异步 fixture 中 `await` 操作挂起或报 `RuntimeError: Event loop is closed`。

### 原因

`pytest-asyncio 1.x` 的事件循环管理与 SQLAlchemy `AsyncSession` 的异步 fixture 存在冲突，特别是多个异步 fixture 之间的会话共享问题。

### 规则

- 锁定 `pytest-asyncio==0.24.0`
- 创建 `pytest.ini`，设置 `asyncio_mode = auto`
- 数据库初始化用同步 fixture，业务操作用异步 fixture

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
```

---

## 四、测试数据隔离

### 现象

测试之间数据互相干扰，先跑的测试创建的数据影响后跑的测试结果。

### 原因

每个测试直接 commit 到数据库，测试结束后数据残留。

### 规则

用 SAVEPOINT 事务嵌套隔离——每个测试在事务内运行，测试结束 rollback，数据库零残留。

```python
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()
```

关键点：
- 使用 `NullPool` 避免连接池复用导致的事务隔离问题
- `expire_on_commit=False` 避免 commit 后访问属性触发懒加载
- 测试结束统一 `rollback`，不留残留数据

---

## 五、硬编码凭证泄露

### 现象

浏览器安全扫描报警：代码中存在弱密码字符串（`user:password`、`change-me-in-production`）。

### 原因

开发阶段图方便，直接在代码中写死了默认密码和密钥。

### 规则

- 所有敏感配置走 `.env` 环境变量
- `.gitignore` 排除 `.env`
- 只提交 `.env.example`（不含真实密码）

```bash
# .env.example（提交到仓库）
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/qingtou_v6
JWT_SECRET=change-me-in-production

# .env（本地使用，不提交）
DATABASE_URL=postgresql+asyncpg://ddjlxl:real_password@localhost:5432/qingtou_v6
JWT_SECRET=real-secret-key-here
```

---

## 六、改密码后 .env 没同步

### 现象

修改了 PostgreSQL 密码后，所有数据库操作报认证失败：

```
asyncpg.exceptions.ConnectionDoesNotExistError: connection was closed in the middle of operation
```

### 原因

改了数据库密码，但 `.env` 文件中 `DATABASE_URL` 还是旧密码。

### 规则

改密码后必须同步更新 `.env`，否则所有依赖数据库的操作都会报认证失败。修改流程：

1. 修改 PostgreSQL 密码
2. 同步更新 `.env` 中的 `DATABASE_URL`
3. 重启应用/测试，验证连接正常

---

## 速查清单

| 场景 | 检查项 |
|------|--------|
| 写测试用例 | 外键字段必须先创建关联记录 |
| 安装依赖 | bcrypt 直接用，不用 passlib |
| 配置 pytest | pytest-asyncio 0.24.0 + asyncio_mode=auto |
| 测试隔离 | SAVEPOINT 事务嵌套 + NullPool |
| 敏感信息 | 全部走 .env，不硬编码 |
| 改数据库密码 | 同步更新 .env |
