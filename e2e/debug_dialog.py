from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    console_log = []
    page.on("console", lambda msg: console_log.append(f"[{msg.type}] {msg.text}"))

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
    dialog.locator('input[placeholder="请输入车牌号"]').fill("京D12345")

    dialog.locator('.el-form-item:has-text("归属性质") .el-select').click()
    page.wait_for_timeout(300)
    page.locator(".el-select-dropdown__item:has-text('自有车辆')").first.click()
    page.wait_for_timeout(300)

    dialog.locator('button:has-text("保存")').click()
    page.wait_for_timeout(3000)

    print("=== Dialog count:", page.locator(".el-dialog").count())
    print("=== Overlay count:", page.locator(".el-overlay-dialog").count())
    print("=== Message count:", page.locator(".el-message").count())

    messages = page.locator(".el-message").all()
    for m in messages:
        print(f"  Message: {m.text_content()}")

    print("\n=== Console errors/warnings ===")
    for log in console_log:
        if log.startswith("[error]") or log.startswith("[warning]"):
            print(f"  {log[:200]}")

    browser.close()
