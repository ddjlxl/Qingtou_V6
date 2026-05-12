"""检查 Vue 开发模式警告和所有可能的错误来源"""
from playwright.sync_api import sync_playwright
import os

FRONTEND_URL = 'http://localhost:9527'

all_msgs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Capture everything
    page.on("console", lambda msg: all_msgs.append(f"[CONSOLE:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_msgs.append(f"[PAGE_ERROR] {err}"))

    # Inject Vue warning capture
    page.add_init_script("""
        window.__allLogs = [];
        const origWarn = console.warn;
        console.warn = function(...args) {
            window.__allLogs.push('WARN: ' + args.map(a => String(a)).join(' '));
            origWarn.apply(console, args);
        };
        const origError = console.error;
        console.error = function(...args) {
            window.__allLogs.push('ERROR: ' + args.map(a => String(a)).join(' '));
            origError.apply(console, args);
        };
        window.addEventListener('error', function(e) {
            window.__allLogs.push('JS_ERROR: ' + e.message + ' @ ' + e.filename + ':' + e.lineno + ':' + e.colno);
        });
        window.addEventListener('unhandledrejection', function(e) {
            window.__allLogs.push('UNHANDLED_REJECTION: ' + String(e.reason));
        });
    """)

    # Navigate and interact
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Login
    try:
        page.locator('input[type="text"]').first.fill('admin')
        page.locator('input[type="password"]').first.fill('admin123')
        page.locator('button:has-text("登录")').first.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    except Exception as e:
        all_msgs.append(f"[SCRIPT_ERR] Login: {e}")

    # Click all tabs
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            all_msgs.append(f"[SCRIPT_ERR] Tab {tab_name}: {e}")

    # Get init script logs
    try:
        logs = page.evaluate("() => window.__allLogs")
        for log in logs:
            all_msgs.append(f"[INIT] {log}")
    except:
        pass

    # Check Vue devtools hook for warnings
    try:
        vue_warnings = page.evaluate("""
            () => {
                const app = document.querySelector('#app').__vue_app__;
                if (!app) return [];
                const warnings = [];
                if (app.config && app.config.warnHandler) {
                    return ['Vue warnHandler is set'];
                }
                return warnings;
            }
        """)
        if vue_warnings:
            for w in vue_warnings:
                all_msgs.append(f"[VUE] {w}")
    except Exception as e:
        all_msgs.append(f"[VUE_CHECK_ERR] {e}")

    browser.close()

# Print all
print("\n" + "=" * 70)
print("ALL MESSAGES")
print("=" * 70)
errors = []
warnings = []
for msg in all_msgs:
    print(f"  {msg}")
    if "ERROR" in msg.upper() or "error" in msg.lower():
        errors.append(msg)
    if "WARN" in msg.upper():
        warnings.append(msg)

print(f"\n{'='*70}")
print(f"Total: {len(all_msgs)} messages")
print(f"Errors: {len(errors)}")
print(f"Warnings: {len(warnings)}")

if errors:
    print("\n❌ ERRORS:")
    for e in errors:
        print(f"  {e}")
if warnings:
    print("\n⚠ WARNINGS:")
    for w in warnings:
        print(f"  {w}")
if not errors and not warnings:
    print("\n✅ Clean!")