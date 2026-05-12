"""检查 Vite 依赖预构建 + 模块解析 + 所有可能的浏览器警告"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'

all_issues = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # CDP - capture EVERYTHING
    cdp = context.new_cdp_session(page)
    cdp.send("Runtime.enable")
    cdp.send("Log.enable")
    cdp.send("Network.enable")

    cdp.on("Runtime.consoleAPICalled", lambda p: all_issues.append(f"[CDP_CONSOLE:{p.get('type','')}] {' '.join([a.get('value',a.get('description','')) for a in p.get('args',[])])}"))
    cdp.on("Runtime.exceptionThrown", lambda p: all_issues.append(f"[CDP_EXCEPTION] {json.dumps(p.get('exceptionDetails',{}), default=str)}"))
    cdp.on("Log.entryAdded", lambda p: all_issues.append(f"[CDP_LOG:{p.get('entry',{}).get('level','')}] {p.get('entry',{}).get('text','')} | source={p.get('entry',{}).get('source','')} | url={p.get('entry',{}).get('url','')}"))
    cdp.on("Network.loadingFailed", lambda p: all_issues.append(f"[CDP_NET_FAIL] {p.get('type','')} {p.get('errorText','')} blocked={p.get('blockedReason','')}"))

    page.on("console", lambda msg: all_issues.append(f"[PW:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_issues.append(f"[PW_PAGE_ERR] {err}"))

    # Navigate to login
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Check Vite's dependency optimization status
    try:
        vite_info = page.evaluate("""
            () => {
                const info = {};
                // Check if Vite's HMR client is connected
                if (window.__vite_plugin_vue_hmr) info['vite_plugin_vue_hmr'] = true;
                // Check for any import errors
                const scripts = document.querySelectorAll('script[type="module"]');
                info['module_scripts'] = scripts.length;
                // Check for any preload links
                const preloads = document.querySelectorAll('link[rel="modulepreload"]');
                info['module_preloads'] = preloads.length;
                return info;
            }
        """)
        all_issues.append(f"[VITE_INFO] {json.dumps(vite_info)}")
    except Exception as e:
        all_issues.append(f"[VITE_INFO_ERR] {e}")

    # Login
    try:
        page.locator('input[type="text"]').first.fill('admin')
        page.locator('input[type="password"]').first.fill('admin123')
        page.locator('button:has-text("登录")').first.click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
    except Exception as e:
        all_issues.append(f"[LOGIN_ERR] {e}")

    # Navigate all tabs
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except Exception as e:
            all_issues.append(f"[TAB_ERR:{tab_name}] {e}")

    # Final deep check - check Vue component tree for errors
    try:
        vue_check = page.evaluate("""
            () => {
                const issues = [];
                const appEl = document.querySelector('#app');
                if (!appEl) return ['#app not found'];
                
                // Walk the DOM looking for error indicators
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                let node;
                while (node = walker.nextNode()) {
                    const el = node;
                    // Check for inline error styles
                    const style = el.getAttribute('style') || '';
                    if (style.includes('color: red') || style.includes('color:red')) {
                        const text = el.textContent?.trim();
                        if (text && text.length > 0 && text.length < 200) {
                            issues.push('Red text element: ' + text);
                        }
                    }
                }
                
                // Check for any console errors that might have been stored
                if (window.__vue_devtools_global_hook__) {
                    issues.push('Vue devtools hook present');
                }
                
                return issues;
            }
        """)
        for v in vue_check:
            all_issues.append(f"[VUE_CHECK] {v}")
    except Exception as e:
        all_issues.append(f"[VUE_CHECK_ERR] {e}")

    browser.close()

# Print
print("\n" + "=" * 70)
print("ALL ISSUES")
print("=" * 70)
errors = []
warnings = []
for msg in all_issues:
    print(f"  {msg}")
    lower = msg.lower()
    if any(kw in lower for kw in ['error', 'exception', 'fail']):
        errors.append(msg)
    elif 'warn' in lower:
        warnings.append(msg)

print(f"\n{'='*70}")
print(f"Total: {len(all_issues)}, Errors: {len(errors)}, Warnings: {len(warnings)}")

if errors:
    print(f"\n❌ ERRORS:")
    for e in errors:
        print(f"  {e}")
if warnings:
    print(f"\n⚠ WARNINGS:")
    for w in warnings:
        print(f"  {w}")
if not errors and not warnings:
    print("\n✅ Clean!")