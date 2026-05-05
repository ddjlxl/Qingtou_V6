@echo off

title QingTou V6 - Stop All Services

echo.
echo ========================================
echo    QingTou V6 - Stop All Services
echo ========================================
echo.

echo Stopping frontend service...
taskkill /F /FI "WINDOWTITLE eq QingTou-V6-Frontend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Frontend service stopped
) else (
    echo Frontend service not running
)

echo Stopping backend service...
taskkill /F /FI "WINDOWTITLE eq QingTou-V6-Backend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Backend service stopped
) else (
    echo Backend service not running
)

echo.
echo ========================================
echo    All Services Stopped
echo ========================================
echo.
pause
