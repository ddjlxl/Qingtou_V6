"""Headed 模式 + 全面路由检测 + 资源加载检查"""
from playwright.sync_api import sync_playwright
import os, json, time

FRONTEND_URL = 'http://localhost:9527'

all_issues = []

with sync_playwright() as p:
    # HEADED mode - 真实渲染
    browser = p.chromium.launch(headless=False, args=['--auto-open-devtools-for-tabs'])
    context = browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        ignore_https_errors=True,
    )
    page = context.new_page()

    # CDP for raw browser logs
    cdp = context.new_cdp_session(page)
    cdp.send("Runtime.enable")
    cdp.send("Log.enable")
    cdp.send("Network.enable")

    def on_cdp_event(event_name, params):
        if event_name == "Runtime.consoleAPICalled":
            msg_type = params.get("type", "log")
            args = params.get("args", [])
            text = " ".join([a.get("value", a.get("description", "")) for a in args])
            all_issues.append(f"[CDP_CONSOLE:{msg_type}] {text}")
        elif event_name == "Runtime.exceptionThrown":
            exc = params.get("exceptionDetails", {})
            text = exc.get("text", "") or str(exc.get("exception", {}).get("description", ""))
            url = exc.get("url", "")
            line = exc.get("lineNumber", "")
            all_issues.append(f"[CDP_EXCEPTION] {text} @ {url}:{line}")
        elif event_name == "Log.entryAdded":
            entry = params.get("entry", {})
            level = entry.get("level", "info")
            text = entry.get("text", "")
            if text:
                all_issues.append(f"[CDP_LOG:{level}] {text}")
        elif event_name == "Network.loadingFailed":
            all_issues.append(f"[CDP_NET_FAIL] {params.get('requestId','')} {params.get('errorText','')} {params.get('blockedReason','')}")

    cdp.on("Runtime.consoleAPICalled", lambda p: on_cdp_event("Runtime.consoleAPICalled", p))
    cdp.on("Runtime.exceptionThrown", lambda p: on_cdp_event("Runtime.exceptionThrown", p))
    cdp.on("Log.entryAdded", lambda p: on_cdp_event("Log.entryAdded", p))
    cdp.on("Network.loadingFailed", lambda p: on_cdp_event("Network.loadingFailed", p))

    page.on("console", lambda msg: all_issues.append(f"[PW:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_issues.append(f"[PW_PAGE_ERR] {err}"))
    page.on("requestfailed", lambda req: all_issues.append(f"[PW_REQ_FAIL] {req.url} - {req.failure}"))

    # ====== 1. 访问首页 / ======
    print("=== 1. 访问 / (Welcome 页) ===")
    page.goto(FRONTEND_URL, wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Check for resource errors
    try:
        resources = page.evaluate("""
            () => performance.getEntriesByType('resource')
                .filter(r => r.name.includes('favicon') || r.transferSize === 0)
                .map(r => ({name: r.name, type: r.initiatorType, duration: r.duration}))
        """)
        for r in resources:
            all_issues.append(f"[RESOURCE] {r['name']} ({r['type']}) duration={r['duration']}")
    except Exception as e:
        all_issues.append(f"[RESOURCE_ERR] {e}")

    # ====== 2. 访问 /login ======
    print("=== 2. 访问 /login ===")
    page.goto(f'{FRONTEND_URL}/login', wait_until='domcontentloaded')
    page.wait_for_timeout(1000)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # ====== 3. 登录 ======
    print("=== 3. 登录 ===")
    try:
        page.locator('input[type="text"]').first.fill('admin')
        page.locator('input[type="password"]').first.fill('admin123')
        page.locator('button:has-text("登录")').first.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    except Exception as e:
        all_issues.append(f"[LOGIN_ERR] {e}")

    # ====== 4. 访问 /fleet 所有 Tab ======
    print("=== 4. 访问 /fleet 所有 Tab ===")
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            all_issues.append(f"[TAB_ERR:{tab_name}] {e}")

    # ====== 5. 检查所有可能的错误来源 ======
    print("=== 5. 深度检查 ===")
    try:
        deep_check = page.evaluate("""
            () => {
                const issues = [];
                
                // Check Vue app errors
                const appEl = document.querySelector('#app');
                if (appEl && appEl.__vue_app__) {
                    const app = appEl.__vue_app__;
                    if (app.config.errorHandler) issues.push('Vue errorHandler configured');
                }
                
                // Check for failed resource loads
                const resources = performance.getEntriesByType('resource');
                for (const r of resources) {
                    if (r.transferSize === 0 && !r.name.includes('localhost')) {
                        issues.push('Zero-size resource: ' + r.name);
                    }
                }
                
                // Check for console errors stored in our interceptor
                if (window.__capturedLogs) {
                    for (const log of window.__capturedLogs) {
                        issues.push('Captured: [' + log.type + '] ' + log.text);
                    }
                }
                
                // Check for any DOM error elements
                const errorEls = document.querySelectorAll(
                    '.el-message--error, .el-alert--error, .el-notification--error, ' +
                    '[class*="error"], [class*="Error"]'
                );
                errorEls.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 0 && text.length < 500) {
                        issues.push('DOM error element: ' + text);
                    }
                });
                
                return issues;
            }
        """)
        for d in deep_check:
            all_issues.append(f"[DEEP] {d}")
    except Exception as e:
        all_issues.append(f"[DEEP_ERR] {e}")

    # ====== 6. 截图保存 ======
    screenshot_path = os.path.join(os.path.dirname(__file__), '..', 'e2e-screenshots', 'headed_final.png')
    os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"Screenshot saved: {screenshot_path}")

    # Keep browser open for a moment
    page.wait_for_timeout(2000)
    browser.close()

# Print results
print("\n" + "=" * 70)
print("ALL ISSUES (Headed Mode)")
print("=" * 70)
errors = []
warnings = []
infos = []
for msg in all_issues:
    print(f"  {msg}")
    lower = msg.lower()
    if any(kw in lower for kw in ['error', 'exception', 'fail', 'err]']):
        errors.append(msg)
    elif 'warn' in lower:
        warnings.append(msg)
    else:
        infos.append(msg)

print(f"\n{'='*70}")
print(f"SUMMARY")
print(f"  Total:    {len(all_issues)}")
print(f"  Errors:   {len(errors)}")
print(f"  Warnings: {len(warnings)}")
print(f"  Info:     {len(infos)}")

if errors:
    print(f"\n❌ {len(errors)} ERRORS:")
    for e in errors:
        print(f"  {e}")
if warnings:
    print(f"\n⚠ {len(warnings)} WARNINGS:")
    for w in warnings:
        print(f"  {w}")

if not errors and not warnings:
    print("\n✅ No errors or warnings!")