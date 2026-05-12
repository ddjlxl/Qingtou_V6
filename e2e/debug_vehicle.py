from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    api_log = []
    def on_response(response):
        if "fleet" in response.url or "auth" in response.url:
            try:
                body = response.text()[:500]
            except:
                body = "N/A"
            api_log.append(f"{response.status} {response.method} {response.url} => {body}")
    page.on("response", on_response)

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
    dialog.locator('input[placeholder="请输入车牌号"]').fill("京B66666")

    dialog.locator('.el-form-item:has-text("归属性质") .el-select').click()
    page.wait_for_timeout(300)
    page.locator(".el-select-dropdown__item:has-text('自有车辆')").first.click()
    page.wait_for_timeout(300)

    dialog.locator('button:has-text("保存")').click()
    page.wait_for_timeout(3000)

    print("=== API Log ===")
    for log in api_log:
        if "vehicles" in log.lower() or "auth" in log.lower():
            print(f"  {log}")

    print("\n=== Console Errors ===")
    for log in console_log:
        if log.startswith("[error]") or log.startswith("[warning]"):
            print(f"  {log}")

    print(f"\n=== Dialog still visible: {page.locator('.el-dialog').count()} ===")
    print(f"=== URL: {page.url} ===")

    browser.close()
