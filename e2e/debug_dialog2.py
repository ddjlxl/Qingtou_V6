from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    page.goto("http://localhost:9527/login")
    page.wait_for_load_state("networkidle")
    page.fill('input[placeholder="请输入用户名"]', "admin")
    page.fill('input[placeholder="请输入密码"]', "admin123")
    page.locator('button:has-text("登录")').click()
    page.wait_for_timeout(3000)

    page.locator(".el-tabs__item:has-text('车辆管理')").click()
    page.wait_for_timeout(1000)

    page.locator('button:has-text("新增车辆")').click()
    page.wait_for_timeout(500)

    dialog = page.locator(".el-dialog").last
    dialog.locator('input[placeholder="请输入车牌号"]').fill("京E55555")

    dialog.locator('.el-form-item:has-text("归属性质") .el-select').click()
    page.wait_for_timeout(300)
    page.locator(".el-select-dropdown__item:has-text('自有车辆')").first.click()
    page.wait_for_timeout(300)

    dialog.locator('button:has-text("保存")').click()
    page.wait_for_timeout(5000)

    print("After save + 5s wait:")
    style_sel = '.el-dialog[style*="visible"]'
    print(f"  Dialog visible: {page.locator(style_sel).count()}")
    print(f"  Overlay count: {page.locator('.el-overlay-dialog').count()}")
    print(f"  el-dialog count: {page.locator('.el-dialog').count()}")

    for i, d in enumerate(page.locator(".el-dialog").all()):
        print(f"  Dialog {i}: visible={d.is_visible()}, title={d.locator('.el-dialog__title').text_content()}")

    page.wait_for_timeout(3000)
    print(f"\nAfter 3s more:")
    print(f"  Overlay count: {page.locator('.el-overlay-dialog').count()}")

    browser.close()
