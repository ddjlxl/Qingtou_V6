"""最终尝试：检查所有可能的错误来源"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'

all_issues = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # CDP for raw browser logs
    cdp = context.new_cdp_session(page)
    cdp.send("Runtime.enable")
    cdp.send("Log.enable")
    cdp.send("Network.enable")

    cdp.on("Runtime.consoleAPICalled", lambda p: all_issues.append(f"[CDP_CONSOLE:{p.get('type','')}] {' '.join([a.get('value',a.get('description','')) for a in p.get('args',[])])}"))
    cdp.on("Runtime.exceptionThrown", lambda p: all_issues.append(f"[CDP_EXCEPTION] {p.get('exceptionDetails',{}).get('text','')}"))
    cdp.on("Log.entryAdded", lambda p: all_issues.append(f"[CDP_LOG:{p.get('entry',{}).get('level','')}] {p.get('entry',{}).get('text','')}"))
    cdp.on("Network.loadingFailed", lambda p: all_issues.append(f"[CDP_NET_FAIL] {p.get('requestId','')} {p.get('errorText','')}"))

    page.on("console", lambda msg: all_issues.append(f"[PW:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_issues.append(f"[PW_PAGE_ERR] {err}"))

    # Navigate and interact
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Check for JS errors via evaluate
    try:
        result = page.evaluate("""
            () => {
                const issues = [];
                // Check for any global error handlers
                if (window.onerror) issues.push('window.onerror is set');
                // Check for any unhandled rejection handlers
                if (window.onunhandledrejection) issues.push('window.onunhandledrejection is set');
                // Check Vue app
                const appEl = document.querySelector('#app');
                if (appEl && appEl.__vue_app__) {
                    const app = appEl.__vue_app__;
                    if (app.config.errorHandler) issues.push('Vue errorHandler is set');
                    if (app.config.warnHandler) issues.push('Vue warnHandler is set');
                }
                // Check performance entries for errors
                const perfEntries = performance.getEntries();
                const badEntries = perfEntries.filter(e => e.name.includes('error') || e.name.includes('fail'));
                badEntries.forEach(e => issues.push('Perf entry: ' + e.name));
                return issues;
            }
        """)
        for r in result:
            all_issues.append(f"[EVAL] {r}")
    except Exception as e:
        all_issues.append(f"[EVAL_ERR] {e}")

    # Login
    try:
        page.locator('input[type="text"]').first.fill('admin')
        page.locator('input[type="password"]').first.fill('admin123')
        page.locator('button:has-text("登录")').first.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    except Exception as e:
        all_issues.append(f"[LOGIN_ERR] {e}")

    # Navigate tabs
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            all_issues.append(f"[TAB_ERR:{tab_name}] {e}")

    # Final check - any errors in the DOM?
    try:
        dom_errors = page.evaluate("""
            () => {
                const issues = [];
                // Check for any error messages in the DOM
                const errorEls = document.querySelectorAll('[class*="error"], [class*="Error"], .el-message--error');
                errorEls.forEach(el => {
                    if (el.textContent && el.textContent.trim()) {
                        issues.push('DOM error: ' + el.textContent.trim().substring(0, 200));
                    }
                });
                return issues;
            }
        """)
        for d in dom_errors:
            all_issues.append(f"[DOM] {d}")
    except Exception as e:
        all_issues.append(f"[DOM_ERR] {e}")

    browser.close()

# Print all
print("\n" + "=" * 70)
print("ALL ISSUES FOUND")
print("=" * 70)
errors = []
warnings = []
for msg in all_issues:
    print(f"  {msg}")
    lower = msg.lower()
    if any(kw in lower for kw in ['error', 'exception', 'fail', 'err]']):
        errors.append(msg)
    if 'warn' in lower:
        warnings.append(msg)

print(f"\n{'='*70}")
print(f"Total: {len(all_issues)} issues")
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
    print("\n✅ No errors or warnings found in browser console!")