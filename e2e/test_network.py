"""拦截所有网络请求，记录每个请求的状态码"""
from playwright.sync_api import sync_playwright
import os, json

FRONTEND_URL = 'http://localhost:9527'

all_requests = []
all_console = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()

    # Intercept ALL requests
    def log_request(request):
        all_requests.append({
            "url": request.url,
            "method": request.method,
            "resource_type": request.resource_type,
        })

    def log_response(response):
        for req in all_requests:
            if req["url"] == response.url and "status" not in req:
                req["status"] = response.status
                req["ok"] = response.ok
                break

    page.on("request", log_request)
    page.on("response", log_response)
    page.on("console", lambda msg: all_console.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: all_console.append(f"[PAGE_ERROR] {err}"))

    # Navigate
    page.goto(f'{FRONTEND_URL}/login')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    # Login
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

    # Navigate tabs
    for tab_name in ['统计概览', '车辆管理', '司机管理', '证照管理', '运输流水']:
        try:
            tab = page.locator(f'.el-tabs__item:has-text("{tab_name}")').first
            if tab.is_visible():
                tab.click()
                page.wait_for_timeout(2000)
                page.wait_for_load_state('networkidle')
        except:
            pass

    browser.close()

# Print all requests
print("\n" + "=" * 80)
print("ALL NETWORK REQUESTS")
print("=" * 80)

failed = []
for i, req in enumerate(all_requests):
    status = req.get("status", "?")
    ok = req.get("ok", "?")
    marker = ""
    if status == "?":
        marker = " ⚠ NO RESPONSE"
        failed.append(req)
    elif not ok:
        marker = " ❌ FAILED"
        failed.append(req)
    print(f"  [{i}] {status:>4} {req['resource_type']:>12s} {req['method']:>6s} {req['url']}{marker}")

# Print console
print(f"\n{'='*80}")
print("CONSOLE OUTPUT")
print("=" * 80)
for msg in all_console:
    print(f"  {msg}")

# Summary
print(f"\n{'='*80}")
print(f"SUMMARY")
print(f"  Total requests:  {len(all_requests)}")
print(f"  Failed/missing:  {len(failed)}")
print(f"  Console msgs:    {len(all_console)}")

if failed:
    print(f"\n❌ {len(failed)} FAILED REQUESTS:")
    for f in failed:
        print(f"  {f.get('status','?')} {f['url']}")
else:
    print(f"\n✅ All requests successful!")