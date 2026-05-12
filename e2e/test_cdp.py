"""使用 CDP 协议捕获所有浏览器日志"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'

all_logs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Create CDP session for raw browser logs
    cdp = context.new_cdp_session(page)

    # Enable Runtime domain to capture console API calls and exceptions
    cdp.send("Runtime.enable")

    # Enable Log domain to capture browser logs
    cdp.send("Log.enable")

    # Listen for CDP events
    def handle_cdp_runtime(event_name, params):
        if event_name == "Runtime.consoleAPICalled":
            msg_type = params.get("type", "log")
            args = params.get("args", [])
            text = " ".join([a.get("value", a.get("description", "")) for a in args])
            all_logs.append(f"[CDP_CONSOLE:{msg_type}] {text}")
        elif event_name == "Runtime.exceptionThrown":
            exc = params.get("exceptionDetails", {})
            text = exc.get("text", "") or str(exc.get("exception", {}).get("description", ""))
            all_logs.append(f"[CDP_EXCEPTION] {text}")
        elif event_name == "Log.entryAdded":
            entry = params.get("entry", {})
            level = entry.get("level", "info")
            text = entry.get("text", "")
            url = entry.get("url", "")
            if text:
                all_logs.append(f"[CDP_LOG:{level}] {text}")

    cdp.on("Runtime.consoleAPICalled", lambda params: handle_cdp_runtime("Runtime.consoleAPICalled", params))
    cdp.on("Runtime.exceptionThrown", lambda params: handle_cdp_runtime("Runtime.exceptionThrown", params))
    cdp.on("Log.entryAdded", lambda params: handle_cdp_runtime("Log.entryAdded", params))

    # Also use Playwright listeners as backup
    page.on("console", lambda msg: all_logs.append(f"[PW_CONSOLE:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_logs.append(f"[PW_PAGE_ERROR] {err}"))

    # Navigate
    print("=== Loading login page ===")
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Login
    print("=== Login ===")
    try:
        page.locator('input[type="text"]').first.fill('admin')
        page.locator('input[type="password"]').first.fill('admin123')
        page.locator('button:has-text("登录")').first.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    except Exception as e:
        all_logs.append(f"[SCRIPT_ERR] {e}")

    # Navigate tabs
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        print(f"=== Tab: {tab_name} ===")
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            all_logs.append(f"[SCRIPT_ERR] {e}")

    # Also check for any JS errors via evaluate
    try:
        js_errors = page.evaluate("""
            () => {
                const errors = [];
                // Check if there are any global error handlers
                const oldOnerror = window.onerror;
                return errors;
            }
        """)
    except:
        pass

    browser.close()

# Print all
print("\n" + "=" * 70)
print("ALL CDP LOGS")
print("=" * 70)
errors = []
warnings = []
for msg in all_logs:
    print(f"  {msg}")
    if "error" in msg.lower() or "exception" in msg.lower():
        errors.append(msg)
    if "warn" in msg.lower():
        warnings.append(msg)

print(f"\n{'='*70}")
print(f"Total: {len(all_logs)} messages")
print(f"Errors/Exceptions: {len(errors)}")
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