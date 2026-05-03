# 浏览器端测试指南

## 什么时候用

单元测试验证的是代码逻辑，但看不到页面实际长什么样。浏览器测试用来验证：
- 页面在真实浏览器中渲染是否正确
- 按钮能不能点、表单能不能提交
- 页面跳转是否正常
- 数据加载、空状态、错误状态的显示效果

## 工具

使用 Playwright 进行浏览器自动化测试。

## 基本用法

### 打开页面并截图

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshot.png', full_page=True)
    browser.close()
```

### 模拟用户操作

```python
# 点击按钮
page.click('button.submit-btn')

# 输入文字
page.fill('input[name="phone"]', '13800138000')

# 等待元素出现
page.wait_for_selector('.success-message')

# 检查文字内容
text = page.text_content('.result')
assert '成功' in text
```

## 测试场景

### 场景一：页面加载

```python
def test_page_loads():
    page.goto('http://localhost:5173/orders')
    page.wait_for_load_state('networkidle')
    # 确认关键元素存在
    assert page.locator('h1').text_content() == '订单管理'
    assert page.locator('table').is_visible()
```

### 场景二：空数据状态

```python
def test_empty_state():
    page.goto('http://localhost:5173/orders')
    page.wait_for_load_state('networkidle')
    # 确认空状态提示显示
    assert page.locator('.empty-state').is_visible()
    assert '暂无数据' in page.locator('.empty-state').text_content()
```

### 场景三：表单提交流程

```python
def test_create_order():
    page.goto('http://localhost:5173/orders/create')
    page.fill('input[name="customerName"]', '测试客户')
    page.select_option('select[name="warehouseId"]', '1')
    page.click('button[type="submit"]')
    page.wait_for_selector('.success-message')
    assert '创建成功' in page.text_content('.success-message')
```

### 场景四：错误处理

```python
def test_error_state():
    # 模拟网络错误
    page.route('**/api/v1/orders', lambda route: route.abort())
    page.goto('http://localhost:5173/orders')
    page.wait_for_load_state('networkidle')
    assert page.locator('.error-state').is_visible()
```

## 注意事项

- 测试前确保开发服务器已启动
- 使用 `networkidle` 等待页面完全加载后再操作
- 截图保存到固定目录，方便排查问题
- 浏览器测试比单元测试慢，只测关键流程
