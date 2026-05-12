from playwright.sync_api import sync_playwright
import sys

BASE_URL = "http://localhost:9527"
SCREENSHOT_DIR = "e:/Qingtou_V6/e2e-screenshots"

passed = 0
failed = 0
errors = []


def report(name: str, ok: bool, detail: str = ""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  ✅ {name}")
    else:
        failed += 1
        errors.append(f"{name}: {detail}")
        print(f"  ❌ {name} — {detail}")


def wait_el_message(page, timeout: int = 5000) -> bool:
    msg = page.locator(".el-message")
    try:
        msg.first.wait_for(state="visible", timeout=timeout)
        return True
    except Exception:
        return False


def go_to_fleet(page):
    page.goto(f"{BASE_URL}/fleet")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    console_errors: list[str] = []
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )

    # ========================================================
    print("\n=== 1. 登录页 ===")
    # ========================================================
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    report("登录页 URL", "/login" in page.url)

    username_input = page.locator('input[placeholder="请输入用户名"]')
    password_input = page.locator('input[placeholder="请输入密码"]')
    login_button = page.locator('button:has-text("登录")')

    report("用户名输入框可见", username_input.is_visible())
    report("密码输入框可见", password_input.is_visible())
    report("登录按钮可见", login_button.is_visible())

    # ========================================================
    print("\n=== 2. 登录验证 ===")
    # ========================================================

    username_input.fill("")
    password_input.fill("")
    login_button.click()
    page.wait_for_timeout(500)
    report("空用户名提示", wait_el_message(page))

    username_input.fill("admin")
    password_input.fill("")
    login_button.click()
    page.wait_for_timeout(500)
    report("空密码提示", wait_el_message(page))

    username_input.fill("wronguser")
    password_input.fill("wrongpass")
    login_button.click()
    page.wait_for_timeout(2000)
    report("错误凭据仍在登录页", "/login" in page.url)

    # ========================================================
    print("\n=== 3. 正确登录 ===")
    # ========================================================
    username_input.fill("admin")
    password_input.fill("admin123")
    login_button.click()
    page.wait_for_timeout(3000)

    report("登录后跳转到 /fleet", "/fleet" in page.url)

    page.screenshot(path=f"{SCREENSHOT_DIR}/01-after-login.png", full_page=True)

    # ========================================================
    print("\n=== 4. 布局组件 ===")
    # ========================================================
    sidebar = page.locator(".app-aside")
    header = page.locator(".app-header")
    report("侧边栏可见", sidebar.is_visible())
    report("顶栏可见", header.is_visible())

    logo_text = page.locator(".app-logo__text")
    report("Logo 文字显示", logo_text.is_visible() and "青投" in logo_text.text_content())

    menu_items = page.locator(".el-menu-item")
    report("侧边栏菜单项数量", menu_items.count() >= 1)
    report("车队管理菜单项", any("车队" in item.text_content() for item in menu_items.all()))

    user_display = page.locator(".app-header__user")
    report("用户名显示", user_display.is_visible() and "系统管理员" in user_display.text_content())

    # ========================================================
    print("\n=== 5. Fleet 页面 Tab 切换 ===")
    # ========================================================
    tabs = page.locator(".el-tabs__item")
    tab_names = ["统计概览", "车辆管理", "司机管理", "证照管理", "运输流水"]
    report("Tab 数量正确", tabs.count() == 5)

    for i, name in enumerate(tab_names):
        tab = tabs.nth(i)
        tab.click()
        page.wait_for_timeout(800)
        report(f"切换到「{name}」Tab", tab.is_visible())

    page.screenshot(path=f"{SCREENSHOT_DIR}/02-tabs.png", full_page=True)

    # ========================================================
    print("\n=== 6. 车辆管理 - 新增 ===")
    # ========================================================
    go_to_fleet(page)
    page.locator(".el-tabs__item:has-text('车辆管理')").click()
    page.wait_for_timeout(1000)

    add_vehicle_btn = page.locator('button:has-text("新增车辆")')
    report("新增车辆按钮可见", add_vehicle_btn.is_visible())

    add_vehicle_btn.click()
    page.wait_for_timeout(500)

    dialog = page.locator(".el-dialog").last
    report("新增车辆对话框打开", dialog.is_visible())
    report("对话框标题", "新增车辆" in dialog.locator(".el-dialog__title").text_content())

    plate_input = dialog.locator('input[placeholder="请输入车牌号"]')
    plate_input.fill("京A88888")

    ownership_select = dialog.locator('.el-form-item:has-text("归属性质") .el-select')
    ownership_select.click()
    page.wait_for_timeout(300)
    page.locator(".el-select-dropdown__item:has-text('自有车辆')").first.click()
    page.wait_for_timeout(300)

    dialog.locator('button:has-text("保存")').click()
    report("新增车辆成功提示", wait_el_message(page, timeout=5000))

    go_to_fleet(page)
    page.locator(".el-tabs__item:has-text('车辆管理')").click()
    page.wait_for_timeout(1000)

    table = page.locator(".vehicle-management .el-table")
    table_rows = table.locator(".el-table__body-wrapper .el-table__row")
    row_count = table_rows.count()
    report("车辆表格有数据", row_count > 0, f"行数: {row_count}")

    if row_count > 0:
        has_new_vehicle = any("京A88888" in row.text_content() for row in table_rows.all())
        report("新车辆在表格中", has_new_vehicle)
    else:
        report("新车辆在表格中", False, "表格无数据")

    page.screenshot(path=f"{SCREENSHOT_DIR}/03-vehicle-added.png", full_page=True)

    # ========================================================
    print("\n=== 7. 车辆管理 - 编辑 ===")
    # ========================================================
    if table_rows.count() > 0:
        edit_btn = table_rows.first.locator('button:has-text("编辑")')
        try:
            edit_btn.click()
            page.wait_for_timeout(1000)
            dialog = page.locator(".el-dialog").last
            is_open = dialog.is_visible()
            report("编辑车辆对话框打开", is_open)
            if is_open:
                try:
                    title_text = dialog.locator(".el-dialog__title").text_content(timeout=3000)
                    report("编辑对话框标题", "编辑车辆" in title_text)
                except Exception:
                    report("编辑对话框标题", False, "无法读取标题")
        except Exception as exc:
            report("编辑车辆对话框打开", False, str(exc)[:80])
    else:
        report("编辑车辆对话框打开", False, "无表格数据")

    # ========================================================
    print("\n=== 8. 司机管理 - 新增 ===")
    # ========================================================
    go_to_fleet(page)
    page.locator(".el-tabs__item:has-text('司机管理')").click()
    page.wait_for_timeout(1000)

    add_driver_btn = page.locator('.driver-management button:has-text("新增司机")')
    report("新增司机按钮可见", add_driver_btn.is_visible())

    add_driver_btn.click()
    page.wait_for_timeout(500)

    dialog = page.locator(".el-dialog").last
    report("新增司机对话框打开", dialog.is_visible())

    name_input = dialog.locator('input[placeholder="请输入司机姓名"]')
    phone_input = dialog.locator('input[placeholder="请输入手机号"]')
    name_input.fill("测试司机")
    phone_input.fill("13800138000")

    dialog.locator('button:has-text("保存")').click()
    report("新增司机成功提示", wait_el_message(page, timeout=5000))

    go_to_fleet(page)
    page.locator(".el-tabs__item:has-text('司机管理')").click()
    page.wait_for_timeout(1000)

    table = page.locator(".driver-management .el-table")
    table_rows = table.locator(".el-table__body-wrapper .el-table__row")
    row_count = table_rows.count()
    report("司机表格有数据", row_count > 0, f"行数: {row_count}")

    if row_count > 0:
        has_new_driver = any("测试司机" in row.text_content() for row in table_rows.all())
        report("新司机在表格中", has_new_driver)
    else:
        report("新司机在表格中", False, "表格无数据")

    page.screenshot(path=f"{SCREENSHOT_DIR}/04-driver-added.png", full_page=True)

    # ========================================================
    print("\n=== 9. 证照管理 ===")
    # ========================================================
    page.locator(".el-tabs__item:has-text('证照管理')").click()
    page.wait_for_timeout(1000)

    add_cert_btn = page.locator('.certificate-management button:has-text("新增证照")')
    report("新增证照按钮可见", add_cert_btn.is_visible())

    expiring_btn = page.locator('.certificate-management button:has-text("即将到期")')
    report("即将到期筛选按钮可见", expiring_btn.is_visible())

    page.screenshot(path=f"{SCREENSHOT_DIR}/05-certificate.png", full_page=True)

    # ========================================================
    print("\n=== 10. 运输流水 ===")
    # ========================================================
    page.locator(".el-tabs__item:has-text('运输流水')").click()
    page.wait_for_timeout(1000)

    import_btn = page.locator('button:has-text("导入运输流水")')
    template_btn = page.locator('button:has-text("下载模板")')
    search_btn = page.locator('button:has-text("查询")')
    reset_btn = page.locator('button:has-text("重置")')

    report("导入按钮可见", import_btn.is_visible())
    report("下载模板按钮可见", template_btn.is_visible())
    report("查询按钮可见", search_btn.is_visible())
    report("重置按钮可见", reset_btn.is_visible())

    date_picker = page.locator(".el-date-editor")
    report("日期范围选择器可见", date_picker.count() > 0)

    page.screenshot(path=f"{SCREENSHOT_DIR}/06-transport.png", full_page=True)

    # ========================================================
    print("\n=== 11. 统计概览 ===")
    # ========================================================
    page.locator(".el-tabs__item:has-text('统计概览')").click()
    page.wait_for_timeout(1000)

    stat_cards = page.locator(".stat-card")
    report("统计卡片显示", stat_cards.count() >= 1)

    warning_card = page.locator(".stat-card--warning")
    if warning_card.is_visible():
        report("证照预警卡片可见", True)
        warning_card.click()
        page.wait_for_timeout(800)
        active_tab = page.locator(".el-tabs__item.is-active")
        report("点击预警卡片跳转到证照管理", "证照" in active_tab.text_content())
    else:
        report("证照预警卡片可见", False)

    page.screenshot(path=f"{SCREENSHOT_DIR}/07-statistics.png", full_page=True)

    # ========================================================
    print("\n=== 12. 侧边栏折叠 ===")
    # ========================================================
    collapse_btn = page.locator(".app-header__collapse-btn")
    collapse_btn.click()
    page.wait_for_timeout(500)

    aside = page.locator(".app-aside")
    report("侧边栏折叠后仍可见", aside.is_visible())

    mini_logo = page.locator(".app-logo__text--mini")
    report("折叠后显示迷你 Logo", mini_logo.is_visible())

    collapse_btn.click()
    page.wait_for_timeout(500)
    full_logo = page.locator(".app-logo__text:not(.app-logo__text--mini)")
    report("展开后恢复完整 Logo", full_logo.is_visible())

    page.screenshot(path=f"{SCREENSHOT_DIR}/08-sidebar-collapse.png", full_page=True)

    # ========================================================
    print("\n=== 13. 退出登录 ===")
    # ========================================================
    user_dropdown = page.locator(".app-header__user")
    user_dropdown.click()
    page.wait_for_timeout(300)

    logout_item = page.locator(".el-dropdown-menu__item:has-text('退出登录')")
    report("退出登录选项可见", logout_item.is_visible())

    logout_item.click()
    page.wait_for_timeout(2000)

    report("退出后跳转到登录页", "/login" in page.url)

    username_input = page.locator('input[placeholder="请输入用户名"]')
    report("登录页输入框可见", username_input.is_visible())

    page.screenshot(path=f"{SCREENSHOT_DIR}/09-logout.png", full_page=True)

    # ========================================================
    print("\n=== 14. 路由守卫 ===")
    # ========================================================
    page.goto(f"{BASE_URL}/fleet")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    report("未登录访问 /fleet 重定向到 /login", "/login" in page.url)

    # ========================================================
    print("\n=== 15. Vue 组件警告检查 ===")
    # ========================================================
    vue_warnings = [e for e in console_errors if "Failed to resolve component" in e]
    report("无未解析组件警告", len(vue_warnings) == 0, f"{len(vue_warnings)} 个未解析组件")

    browser.close()

# ========================================================
print("\n" + "=" * 50)
print(f"  e2e 测试结果: {passed} 通过 / {failed} 失败 / 共 {passed + failed} 项")
print("=" * 50)

if errors:
    print("\n失败详情:")
    for e in errors:
        print(f"  ❌ {e}")

sys.exit(1 if failed > 0 else 0)
