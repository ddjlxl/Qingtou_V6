@echo off

title QingTou V6 - Stop All Services

set "FRONTEND_PORT=9527"
set "BACKEND_PORT=9528"

echo.
echo ========================================
echo    QingTou V6 - Stop All Services
echo ========================================
echo.

echo Stopping frontend service (port %FRONTEND_PORT%)...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%i >nul 2>&1 && echo OK: Process %%i killed
)
netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 echo OK: Port %FRONTEND_PORT% released

echo Stopping backend service (port %BACKEND_PORT%)...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%i >nul 2>&1 && echo OK: Process %%i killed
)
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 echo OK: Port %BACKEND_PORT% released

echo.
echo ========================================
echo    All Services Stopped
echo ========================================
echo.
pause
