"""全面捕获浏览器控制台错误 - 含网络请求、404、未处理异常"""
from playwright.sync_api import sync_playwright
import os, json, sys

FRONTEND_URL = 'http://localhost:9527'
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'e2e-screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

all_events = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Capture ALL console messages
    page.on("console", lambda msg: all_events.append({
        "source": "console",
        "type": msg.type,
        "text": msg.text,
        "location": str(msg.location) if msg.location else "",
    }))

    # Capture page errors (uncaught exceptions)
    page.on("pageerror", lambda err: all_events.append({
        "source": "pageerror",
        "text": str(err),
    }))

    # Capture failed requests
    page.on("requestfailed", lambda req: all_events.append({
        "source": "requestfailed",
        "url": req.url,
        "failure": req.failure,
    }))

    # Capture response errors (4xx, 5xx)
    page.on("response", lambda resp: all_events.append({
        "source": "response",
        "url": resp.url,
        "status": resp.status,
        "ok": resp.ok,
    }) if not resp.ok else None)

    print("=== Step 1: Login page ===")
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'full-01-login.png'), full_page=True)

    # Fill and submit login
    print("=== Step 2: Login ===")
    username_input = page.locator('input[type="text"]').first
    password_input = page.locator('input[type="password"]').first
    if username_input.is_visible():
        username_input.fill('admin')
        password_input.fill('admin123')
    login_btn = page.locator('button:has-text("登录")').first
    if login_btn.is_visible():
        login_btn.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    print(f"  URL after login: {page.url}")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'full-02-after-login.png'), full_page=True)

    # Click through all tabs
    tabs = ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']
    for tab_name in tabs:
        print(f"=== Tab: {tab_name} ===")
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, f'full-tab-{tab_name}.png'), full_page=True)

                # Try clicking add buttons
                for btn_text in ['新增车辆', '新增司机', '新增证照', '新增', '添加', '录入']:
                    btn = page.locator(f'button:has-text("{btn_text}")').first
                    if btn.is_visible():
                        print(f"  Clicking: {btn_text}")
                        btn.click()
                        page.wait_for_timeout(1500)
                        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f'full-dialog-{tab_name}.png'), full_page=True)
                        # Close dialog
                        cancel = page.locator('button:has-text("取消")').first
                        if cancel.is_visible():
                            cancel.click()
                        else:
                            page.keyboard.press('Escape')
                        page.wait_for_timeout(500)
                        break
        except Exception as e:
            all_events.append({"source": "script_error", "text": str(e), "tab": tab_name})

    # Test sidebar
    print("=== Sidebar ===")
    try:
        collapse_icon = page.locator('.app-header__collapse-btn').first
        if collapse_icon.is_visible():
            collapse_icon.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'full-sidebar-collapsed.png'), full_page=True)
            collapse_icon.click()
            page.wait_for_timeout(500)
    except Exception as e:
        all_events.append({"source": "script_error", "text": str(e), "context": "sidebar"})

    # Test logout
    print("=== Logout ===")
    try:
        user_dropdown = page.locator('.app-header__user').first
        if user_dropdown.is_visible():
            user_dropdown.click()
            page.wait_for_timeout(500)
            logout_item = page.locator('.el-dropdown-menu__item:has-text("退出登录")').first
            if logout_item.is_visible():
                logout_item.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'full-after-logout.png'), full_page=True)
    except Exception as e:
        all_events.append({"source": "script_error", "text": str(e), "context": "logout"})

    browser.close()

# Print ALL events
print("\n" + "=" * 70)
print("ALL CAPTURED EVENTS")
print("=" * 70)

for i, evt in enumerate(all_events):
    source = evt.get("source", "?")
    if source == "console":
        print(f"  [{i}] CONSOLE:{evt.get('type','?').upper():8s} {evt.get('text','')}")
    elif source == "pageerror":
        print(f"  [{i}] PAGE_ERROR: {evt.get('text','')}")
    elif source == "requestfailed":
        print(f"  [{i}] REQUEST_FAILED: {evt.get('url','')} -> {evt.get('failure','')}")
    elif source == "response":
        print(f"  [{i}] HTTP {evt.get('status','')}: {evt.get('url','')}")
    elif source == "script_error":
        print(f"  [{i}] SCRIPT_ERROR: {evt.get('text','')}")

# Summary
errors = [e for e in all_events if e.get("source") in ("pageerror", "requestfailed")]
console_errors = [e for e in all_events if e.get("source") == "console" and e.get("type") == "error"]
http_errors = [e for e in all_events if e.get("source") == "response"]
warnings = [e for e in all_events if e.get("source") == "console" and e.get("type") == "warning"]

print(f"\n{'='*70}")
print(f"SUMMARY: {len(all_events)} total events")
print(f"  Console errors:   {len(console_errors)}")
print(f"  Console warnings: {len(warnings)}")
print(f"  Page errors:      {len(errors)}")
print(f"  HTTP errors:      {len(http_errors)}")

if console_errors or errors or http_errors:
    print("\n❌ ISSUES FOUND!")
else:
    print("\n✅ No issues found!")

# Save full log
with open(os.path.join(SCREENSHOT_DIR, 'full-console-log.json'), 'w', encoding='utf-8') as f:
    json.dump(all_events, f, ensure_ascii=False, indent=2, default=str)