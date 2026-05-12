"""全面测试前端应用，捕获控制台错误"""
from playwright.sync_api import sync_playwright
import json
import sys
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

    # Step 1: Navigate to login page
    print("\n=== Step 1: Navigate to login page ===")
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'test-01-login-page.png'), full_page=True)

    # Step 2: Try to fill login form
    print("\n=== Step 2: Fill login form ===")
    try:
        username_input = page.locator('input[type="text"], input[placeholder*="用户"], input[placeholder*="账号"], input[placeholder*="username"]').first
        password_input = page.locator('input[type="password"]').first
        if username_input.is_visible():
            username_input.fill('admin')
            password_input.fill('admin123')
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'test-02-filled-form.png'), full_page=True)
            print("  Login form filled")
        else:
            print("  Username input not found")
    except Exception as e:
        print(f"  Error filling form: {e}")

    # Step 3: Click login button
    print("\n=== Step 3: Click login button ===")
    try:
        login_btn = page.locator('button:has-text("登录"), button:has-text("Login"), button[type="submit"]').first
        if login_btn.is_visible():
            login_btn.click()
            page.wait_for_timeout(3000)
            page.wait_for_load_state('networkidle')
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'test-03-after-login-click.png'), full_page=True)
            print("  Login button clicked")
        else:
            print("  Login button not found")
    except Exception as e:
        print(f"  Error clicking login: {e}")

    # Step 4: Check current URL
    print(f"\n=== Step 4: Current URL: {page.url} ===")
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'test-04-current-page.png'), full_page=True)

    # Step 5: Navigate to fleet page directly
    print("\n=== Step 5: Navigate to fleet page ===")
    page.goto(f'{FRONTEND_URL}/fleet')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(SCREENSHOT_DIR, 'test-05-fleet-page.png'), full_page=True)

    # Step 6: Check for any tabs or interactive elements
    print("\n=== Step 6: Explore fleet page ===")
    try:
        tabs = page.locator('.el-tabs__item, [role="tab"]').all()
        print(f"  Found {len(tabs)} tabs")
        for i, tab in enumerate(tabs[:5]):
            text = tab.text_content()
            print(f"    Tab {i}: {text}")
            try:
                tab.click()
                page.wait_for_timeout(1000)
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, f'test-06-tab-{i}.png'), full_page=True)
            except Exception as e:
                print(f"    Error clicking tab {i}: {e}")
    except Exception as e:
        print(f"  Error exploring tabs: {e}")

    # Step 7: Check for any dialog buttons
    print("\n=== Step 7: Check for action buttons ===")
    try:
        buttons = page.locator('button:visible').all()
        print(f"  Found {len(buttons)} visible buttons")
        for i, btn in enumerate(buttons[:10]):
            text = btn.text_content().strip()
            print(f"    Button {i}: '{text}'")
    except Exception as e:
        print(f"  Error checking buttons: {e}")

    browser.close()

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
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
    print("\n✅ No console errors or page errors found!")
else:
    print(f"\n❌ Found {len(errors)} console errors and {len(page_errors)} page errors")

# Save detailed logs
log_file = os.path.join(SCREENSHOT_DIR, 'console-logs.json')
with open(log_file, 'w', encoding='utf-8') as f:
    json.dump({'console_logs': console_logs, 'page_errors': page_errors}, f, ensure_ascii=False, indent=2)
print(f"\nDetailed logs saved to: {log_file}")