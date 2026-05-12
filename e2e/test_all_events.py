"""捕获所有浏览器输出 - 包括 info/log 级别，以及初始加载阶段"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'e2e-screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

all_events = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Capture ALL console messages immediately
    page.on("console", lambda msg: all_events.append({
        "source": "console",
        "type": msg.type,
        "text": msg.text,
        "location": str(msg.location) if msg.location else "",
    }))

    page.on("pageerror", lambda err: all_events.append({
        "source": "pageerror",
        "text": str(err),
    }))

    page.on("requestfailed", lambda req: all_events.append({
        "source": "requestfailed",
        "url": req.url,
        "failure": str(req.failure) if req.failure else "unknown",
    }))

    page.on("response", lambda resp: all_events.append({
        "source": "response",
        "url": resp.url,
        "status": resp.status,
    }) if resp.status >= 400 else None)

    # Step 1: Navigate and capture DURING load (don't wait for networkidle first)
    print("=== Navigate to login (capturing during load) ===")
    page.goto(f'{FRONTEND_URL}/login', wait_until='commit')
    page.wait_for_timeout(500)
    # Capture events during load
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_timeout(500)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Step 2: Login
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

    # Step 3: Navigate through all tabs
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
            all_events.append({"source": "script_error", "text": str(e)})

    # Step 4: Navigate directly to fleet (full page load)
    print("=== Direct navigation to /fleet ===")
    page.goto(f'{FRONTEND_URL}/fleet', wait_until='commit')
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_timeout(500)
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    browser.close()

# Print ALL events grouped by type
print("\n" + "=" * 70)
print("ALL CAPTURED EVENTS (grouped)")
print("=" * 70)

by_type = {}
for evt in all_events:
    t = evt.get("source", "?") + ":" + evt.get("type", "")
    by_type.setdefault(t, []).append(evt)

for t, evts in sorted(by_type.items()):
    print(f"\n--- {t} ({len(evts)} events) ---")
    for evt in evts:
        if evt.get("source") == "console":
            print(f"  {evt.get('text','')}")
        elif evt.get("source") == "requestfailed":
            print(f"  FAILED: {evt.get('url','')} -> {evt.get('failure','')}")
        elif evt.get("source") == "response":
            print(f"  HTTP {evt.get('status','')}: {evt.get('url','')}")
        elif evt.get("source") == "pageerror":
            print(f"  PAGE ERROR: {evt.get('text','')}")
        else:
            print(f"  {evt}")

# Summary
console_errors = [e for e in all_events if e.get("source") == "console" and e.get("type") == "error"]
console_warnings = [e for e in all_events if e.get("source") == "console" and e.get("type") == "warning"]
page_errors = [e for e in all_events if e.get("source") == "pageerror"]
failed_requests = [e for e in all_events if e.get("source") == "requestfailed"]
http_errors = [e for e in all_events if e.get("source") == "response"]

print(f"\n{'='*70}")
print(f"FINAL SUMMARY")
print(f"  Total events:        {len(all_events)}")
print(f"  Console errors:      {len(console_errors)}")
print(f"  Console warnings:    {len(console_warnings)}")
print(f"  Page errors:         {len(page_errors)}")
print(f"  Failed requests:     {len(failed_requests)}")
print(f"  HTTP 4xx/5xx:        {len(http_errors)}")

issues = console_errors + console_warnings + page_errors + failed_requests + http_errors
if issues:
    print(f"\n❌ {len(issues)} ISSUES FOUND!")
else:
    print(f"\n✅ No issues found!")

with open(os.path.join(SCREENSHOT_DIR, 'all-events.json'), 'w', encoding='utf-8') as f:
    json.dump(all_events, f, ensure_ascii=False, indent=2, default=str)