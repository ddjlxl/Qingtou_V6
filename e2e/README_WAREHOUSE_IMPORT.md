# 仓库导入功能 E2E 测试

## 测试文件

- `test_warehouse_import.py` - 仓库导入功能的完整e2e测试
- `create_test_excel.py` - 创建测试用的Excel文件

## 测试数据

测试数据位于 `e:/Qingtou_V6/e2e/test-data/` 目录：

- `valid_import.xlsx` - 5条有效数据
- `invalid_import.xlsx` - 2条无效数据（格式错误）
- `partial_import.xlsx` - 2条有效 + 1条无效数据

## 运行测试

### 前置条件

1. 确保后端服务运行在 `http://localhost:9527`
2. 确保数据库已初始化并有测试数据
3. 确保已安装Playwright：`pip install playwright`

### 创建测试数据

```bash
cd e:/Qingtou_V6/e2e
python create_test_excel.py
```

### 运行测试

```bash
cd e:/Qingtou_V6/e2e
python test_warehouse_import.py
```

## 测试覆盖场景

### 1. 登录验证
- ✅ 使用正确凭据登录成功

### 2. 页面访问
- ✅ 访问仓库页面URL正确
- ✅ 页面标题显示正确

### 3. 页面元素检查
- ✅ 区域选择器可见
- ✅ 手动录入按钮可见
- ✅ 导入按钮可见
- ✅ 出库按钮可见
- ✅ 移动按钮可见
- ✅ 编辑按钮可见

### 4. 区域选择
- ✅ 区域选项数量正确（12个）
- ✅ 选择第一个区域成功

### 5. 导入对话框
- ✅ 导入对话框打开
- ✅ 对话框标题正确
- ✅ 上传提示可见
- ✅ 上传提示内容正确
- ✅ 上传区域可见

### 6. 有效文件导入
- ✅ 导入成功提示显示
- ✅ 对话框自动关闭

### 7. 数据刷新验证
- ✅ 区域卡片显示
- ✅ 第一个区域有12个库位
- ✅ 第一个区域已使用库位数量正确
- ✅ 统计面板显示

### 8. 无效文件上传
- ✅ 导入对话框再次打开
- ✅ 错误提示显示

### 9. 部分有效文件上传
- ✅ 导入对话框第三次打开
- ✅ 部分成功提示显示

### 10. 非xlsx文件上传
- ✅ 导入对话框第四次打开
- ✅ 非xlsx文件错误提示

### 11. 未选择区域场景
- ✅ 未选择区域时导入按钮禁用

### 12. 移动模式场景
- ✅ 移动模式下导入按钮禁用

### 13. Vue组件检查
- ✅ 无未解析组件警告

## 测试结果

最新测试结果：**31 通过 / 0 失败 / 共 31 项**

## 截图

测试过程中会自动生成截图，保存在 `e:/Qingtou_V6/e2e-screenshots/warehouse-import/` 目录：

- `01-after-login.png` - 登录后页面
- `02-warehouse-page.png` - 仓库页面
- `03-zone-selected.png` - 选择区域后
- `04-import-dialog.png` - 导入对话框
- `05-after-valid-import.png` - 有效文件导入后
- `06-data-refreshed.png` - 数据刷新后
- `07-invalid-import.png` - 无效文件导入
- `08-partial-import.png` - 部分有效文件导入
- `09-non-xlsx-file.png` - 非xlsx文件上传
- `10-no-zone-selected.png` - 未选择区域
- `11-move-mode-import-disabled.png` - 移动模式

## 注意事项

1. 测试会创建真实的入库数据，建议在测试环境中运行
2. 每次测试前建议清理数据库中的测试数据
3. 测试使用的箱号格式为 `TEST0000001` 到 `TEST0000008`，可以用于识别测试数据
4. 如果测试失败，检查截图目录中的截图以了解失败时的页面状态
