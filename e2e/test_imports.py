"""检查模块动态导入 + Vue 组件渲染警告 + 所有可能的错误"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'

all_issues = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # CDP
    cdp = context.new_cdp_session(page)
    cdp.send("Runtime.enable")
    cdp.send("Log.enable")
    cdp.send("Network.enable")

    cdp.on("Runtime.consoleAPICalled", lambda p: all_issues.append(f"[CDP_CONSOLE:{p.get('type','')}] {' '.join([a.get('value',a.get('description','')) for a in p.get('args',[])])}"))
    cdp.on("Runtime.exceptionThrown", lambda p: all_issues.append(f"[CDP_EXCEPTION] {json.dumps(p.get('exceptionDetails',{}), default=str)[:500]}"))
    cdp.on("Log.entryAdded", lambda p: all_issues.append(f"[CDP_LOG:{p.get('entry',{}).get('level','')}] {p.get('entry',{}).get('text','')}"))
    cdp.on("Network.loadingFailed", lambda p: all_issues.append(f"[CDP_NET_FAIL] {p.get('errorText','')}"))

    page.on("console", lambda msg: all_issues.append(f"[PW:{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_issues.append(f"[PW_PAGE_ERR] {err}"))

    # Navigate
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(3000)

    # Test dynamic imports of key modules
    print("=== Testing dynamic imports ===")
    modules_to_test = [
        "camelcase-keys",
        "axios",
        "element-plus",
        "@element-plus/icons-vue",
        "pinia",
        "vue-router",
    ]
    for mod in modules_to_test:
        try:
            result = page.evaluate(f"""
                async () => {{
                    try {{
                        const m = await import('{mod}');
                        return 'OK: ' + Object.keys(m).slice(0, 5).join(', ');
                    }} catch(e) {{
                        return 'ERROR: ' + e.message;
                    }}
                }}
            """)
            all_issues.append(f"[IMPORT:{mod}] {result}")
        except Exception as e:
            all_issues.append(f"[IMPORT:{mod}] EVAL_ERR: {e}")

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

    # Check Vue component instances for warnings
    try:
        vue_state = page.evaluate("""
            () => {
                const info = {};
                const appEl = document.querySelector('#app');
                if (appEl && appEl.__vue_app__) {
                    const app = appEl.__vue_app__;
                    info['version'] = app.version;
                    info['components'] = Object.keys(app._component?.components || {}).length;
                    
                    // Check all mounted component instances
                    const instances = [];
                    function walkVNode(vnode) {
                        if (!vnode) return;
                        if (vnode.component) {
                            instances.push({
                                type: vnode.component.type?.name || vnode.component.type?.__name || 'Anonymous',
                                props: Object.keys(vnode.component.props || {}),
                            });
                        }
                        if (vnode.children && Array.isArray(vnode.children)) {
                            vnode.children.forEach(walkVNode);
                        }
                        if (vnode.component?.subTree) {
                            walkVNode(vnode.component.subTree);
                        }
                    }
                    walkVNode(app._instance?.subTree);
                    info['mounted_instances'] = instances.length;
                    info['instance_names'] = instances.map(i => i.type);
                }
                return info;
            }
        """)
        all_issues.append(f"[VUE_STATE] {json.dumps(vue_state)}")
    except Exception as e:
        all_issues.append(f"[VUE_STATE_ERR] {e}")

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