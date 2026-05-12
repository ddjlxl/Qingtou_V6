"""使用 addInitScript 在页面代码运行前拦截所有 console 输出"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'e2e-screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

captured = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Inject script BEFORE any page code runs to intercept ALL console calls
    page.add_init_script("""
        window.__capturedLogs = [];
        const orig = {};
        ['log', 'warn', 'error', 'info', 'debug'].forEach(m => {
            orig[m] = console[m];
            console[m] = function(...args) {
                window.__capturedLogs.push({type: m, text: args.map(a => {
                    try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
                    catch(e) { return String(a); }
                }).join(' ')});
                orig[m].apply(console, args);
            };
        });
        window.addEventListener('error', function(e) {
            window.__capturedLogs.push({type: 'window-error', text: e.message + ' at ' + e.filename + ':' + e.lineno});
        });
        window.addEventListener('unhandledrejection', function(e) {
            window.__capturedLogs.push({type: 'unhandled-rejection', text: String(e.reason)});
        });
    """)

    # Also use Playwright's native listeners
    page.on("console", lambda msg: captured.append({"source": "playwright", "type": msg.type, "text": msg.text}))
    page.on("pageerror", lambda err: captured.append({"source": "playwright-pageerror", "text": str(err)}))
    page.on("requestfailed", lambda req: captured.append({"source": "playwright-requestfail", "url": req.url, "error": str(req.failure)}))
    page.on("response", lambda resp: captured.append({"source": "playwright-response", "url": resp.url, "status": resp.status}) if resp.status >= 400 else None)

    # Navigate
    print("=== Loading login page ===")
    page.goto(f'{FRONTEND_URL}/login', wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Get captured logs from init script
    init_logs = page.evaluate("() => window.__capturedLogs")
    for log in init_logs:
        captured.append({"source": "initscript", "type": log.get("type", ""), "text": log.get("text", "")})

    # Login
    print("=== Login ===")
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

    # Get more logs after login
    init_logs2 = page.evaluate("() => window.__capturedLogs")
    for log in init_logs2[len(init_logs):]:
        captured.append({"source": "initscript", "type": log.get("type", ""), "text": log.get("text", "")})

    # Navigate tabs
    tabs = ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']
    for tab_name in tabs:
        print(f"=== Tab: {tab_name} ===")
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            captured.append({"source": "script", "type": "error", "text": str(e)})

    # Final log capture
    init_logs3 = page.evaluate("() => window.__capturedLogs")
    for log in init_logs3[len(init_logs2):]:
        captured.append({"source": "initscript", "type": log.get("type", ""), "text": log.get("text", "")})

    browser.close()

# Print ALL events
print("\n" + "=" * 70)
print("ALL CAPTURED EVENTS")
print("=" * 70)
for i, evt in enumerate(captured):
    src = evt.get("source", "?")
    typ = evt.get("type", "?")
    txt = evt.get("text", evt.get("url", ""))
    print(f"  [{i}] {src}:{typ} | {txt}")

# Summary
errors = [e for e in captured if e.get("type") in ("error", "window-error", "unhandled-rejection")]
warnings = [e for e in captured if e.get("type") == "warn"]
fails = [e for e in captured if "fail" in e.get("source", "")]
http_errs = [e for e in captured if e.get("source") == "playwright-response"]

print(f"\n{'='*70}")
print(f"SUMMARY: {len(captured)} events")
print(f"  Errors:     {len(errors)}")
print(f"  Warnings:   {len(warnings)}")
print(f"  Req fails:  {len(fails)}")
print(f"  HTTP 4xx+:  {len(http_errs)}")

if errors or fails or http_errs:
    print("\n❌ ISSUES FOUND!")
    for e in errors:
        print(f"  ERROR: {e.get('text', '')}")
else:
    print("\n✅ No errors found!")