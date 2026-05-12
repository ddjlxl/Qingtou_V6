"""深度交互测试 - 点击每个 Tab、打开对话框、测试表单"""
from playwright.sync_api import sync_playwright
import os

FRONTEND_URL = 'http://localhost:9527'
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'e2e-screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

console_logs = []
page_errors = []

def handle_console(msg):
    entry = {'type': msg.type, 'text': msg.text, 'location': msg.location}
    console_logs.append(entry)
    print(f"  [CONSOLE:{msg.type.upper()}] {msg.text}")

def handle_page_error(error):
    page_errors.append(str(error))
    print(f"  [PAGE_ERROR] {error}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    page.on("console", handle_console)
    page.on("pageerror", handle_page_error)

    # Login
    print("\n=== Login ===")
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    
    username_input = page.locator('input[type="text"]').first
    password_input = page.locator('input[type="password"]').first
    username_input.fill('admin')
    password_input.fill('admin123')
    
    login_btn = page.locator('button:has-text("登录")').first
    login_btn.click()
    page.wait_for_timeout(3000)
    page.wait_for_load_state('networkidle')
    print(f"  Current URL: {page.url}")

    # Test each tab
    tabs = ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']
    
    for tab_name in tabs:
        print(f"\n=== Tab: {tab_name} ===")
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, f'deep-{tab_name}.png'), full_page=True)
                
                # Check for add buttons
                add_buttons = page.locator('button:has-text("新增"), button:has-text("添加"), button:has-text("录入")').all()
                print(f"  Add buttons: {len(add_buttons)}")
                
                # Click first add button if exists
                for btn in add_buttons:
                    if btn.is_visible():
                        btn_text = btn.text_content().strip()
                        print(f"  Clicking: '{btn_text}'")
                        btn.click()
                        page.wait_for_timeout(1500)
                        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f'deep-{tab_name}-dialog.png'), full_page=True)
                        
                        # Try to close dialog
                        cancel_btn = page.locator('button:has-text("取消"), button:has-text("关闭")').first
                        if cancel_btn.is_visible():
                            cancel_btn.click()
                            page.wait_for_timeout(500)
                        else:
                            page.keyboard.press('Escape')
                            page.wait_for_timeout(500)
                        break
            else:
                print(f"  Tab not visible")
        except Exception as e:
            print(f"  Error: {e}")

    # Test sidebar collapse
    print("\n=== Sidebar collapse ===")
    try:
        collapse_btn = page.locator('.el-menu button, .collapse-btn, [class*="collapse"]').first
        if collapse_btn.is_visible():
            collapse_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'deep-sidebar-collapsed.png'), full_page=True)
            collapse_btn.click()
            page.wait_for_timeout(500)
    except Exception as e:
        print(f"  Error: {e}")

    # Test logout
    print("\n=== Logout ===")
    try:
        logout_btn = page.locator('button:has-text("退出"), button:has-text("登出"), [class*="logout"]').first
        if logout_btn.is_visible():
            logout_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'deep-after-logout.png'), full_page=True)
            print(f"  After logout URL: {page.url}")
    except Exception as e:
        print(f"  Error: {e}")

    browser.close()

# Summary
print("\n" + "=" * 60)
print("DEEP TEST SUMMARY")
print("=" * 60)

errors = [l for l in console_logs if l['type'] == 'error']
warnings = [l for l in console_logs if l['type'] == 'warning']

print(f"\nTotal console messages: {len(console_logs)}")
print(f"Errors: {len(errors)}")
print(f"Warnings: {len(warnings)}")
print(f"Page errors: {len(page_errors)}")

if errors:
    print("\n--- CONSOLE ERRORS ---")
    for e in errors:
        print(f"  {e['text']}")

if warnings:
    print("\n--- CONSOLE WARNINGS ---")
    for w in warnings:
        print(f"  {w['text']}")

if page_errors:
    print("\n--- PAGE ERRORS ---")
    for e in page_errors:
        print(f"  {e}")

if not errors and not page_errors:
    print("\n✅ No errors found!")
else:
    print(f"\n❌ Found {len(errors)} console errors and {len(page_errors)} page errors")