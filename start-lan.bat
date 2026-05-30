@echo off

title QingTou V6 - LAN Access Mode

set "FRONTEND_PORT=9527"
set "BACKEND_PORT=8000"
set "LOG_FILE=startup-lan.log"

echo.
echo ========================================
echo    QingTou V6 - LAN Access Mode
echo ========================================
echo.
echo This script enables LAN access for mobile devices
echo.

echo [%date% %time%] Script started > %LOG_FILE%

echo [1/7] Detecting LAN IP Address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LAN_IP=%%a
    goto :got_ip
)
:got_ip
set LAN_IP=%LAN_IP: =%
if "%LAN_IP%"=="" (
    echo ERROR: Cannot detect LAN IP address
    echo TIP: Please check your network connection
    echo [%date% %time%] ERROR: No LAN IP detected >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo OK: LAN IP Address: %LAN_IP%
echo [%date% %time%] LAN IP: %LAN_IP% >> %LOG_FILE%

echo.
echo [2/7] Checking Node.js...
if not exist "E:\RuanJian\nodejs\node.exe" (
    echo ERROR: Node.js not found
    echo TIP: Visit https://nodejs.org/ to download
    echo [%date% %time%] ERROR: Node.js not found >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('E:\RuanJian\nodejs\node.exe -v') do set NODE_VERSION=%%i
echo OK: Node.js installed: %NODE_VERSION%
echo [%date% %time%] Node.js version: %NODE_VERSION% >> %LOG_FILE%

echo.
echo [3/7] Checking pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pnpm not found
    echo TIP: Run "npm install -g pnpm" to install
    echo [%date% %time%] ERROR: pnpm not found >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('pnpm -v 2^>^&1') do set PNPM_VERSION=%%i
echo OK: pnpm installed: %PNPM_VERSION%
echo [%date% %time%] pnpm version: %PNPM_VERSION% >> %LOG_FILE%

echo.
echo [4/7] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found
    echo TIP: Visit https://www.python.org/downloads/ to download
    echo [%date% %time%] ERROR: Python not found >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo OK: Python installed: %PYTHON_VERSION%
echo [%date% %time%] Python version: %PYTHON_VERSION% >> %LOG_FILE%

echo.
echo [5/7] Configuring LAN Access...

echo Creating frontend .env files...
(
    echo VITE_API_BASE_URL=/api
) > apps\frontend\.env
(
    echo VITE_API_BASE_URL=/api
    echo VITE_TIANDITU_KEY=YOUR_TIANDITU_KEY_HERE
) > apps\frontend\.env.development
echo OK: Frontend .env files created (using Vite proxy mode)
echo [%date% %time%] Frontend .env files created >> %LOG_FILE%

echo Updating backend CORS configuration...
powershell -Command "$c = Get-Content 'apps\server\app\core\config.py' -Raw -Encoding UTF8; $c = $c -replace 'CORS_ORIGINS: list\[str\] = \[.*?\]', ('CORS_ORIGINS: list[str] = [\"http://localhost:9527\", \"http://localhost:9528\", \"http://localhost:9529\", \"http://127.0.0.1:9527\", \"http://127.0.0.1:9528\", \"http://127.0.0.1:9529\", \"http://%LAN_IP%:9527\", \"http://%LAN_IP%:9528\", \"http://%LAN_IP%:9529\"]'); [System.IO.File]::WriteAllText('apps\server\app\core\config.py', $c, [System.Text.Encoding]::UTF8)"
echo OK: Backend CORS updated
echo [%date% %time%] Backend CORS updated >> %LOG_FILE%

echo Configuring Windows Firewall...
netsh advfirewall firewall show rule name="QingTou V6 Backend" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="QingTou V6 Backend" dir=in action=allow protocol=TCP localport=%BACKEND_PORT% >nul 2>&1
    echo OK: Firewall rule added for port %BACKEND_PORT%
) else (
    echo OK: Firewall rule already exists for port %BACKEND_PORT%
)
netsh advfirewall firewall show rule name="QingTou V6 Frontend" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="QingTou V6 Frontend" dir=in action=allow protocol=TCP localport=%FRONTEND_PORT% >nul 2>&1
    echo OK: Firewall rule added for port %FRONTEND_PORT%
) else (
    echo OK: Firewall rule already exists for port %FRONTEND_PORT%
)
echo [%date% %time%] Firewall configured >> %LOG_FILE%

echo.
echo [6/7] Checking port availability...
set PORT_CONFLICT=0

for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr " 0.0.0.0:%FRONTEND_PORT% "') do set FRONTEND_PID=%%a
if defined FRONTEND_PID (
    echo WARNING: Port %FRONTEND_PORT% is already in use ^(PID: %FRONTEND_PID%^)
    echo   Attempting to stop the process...
    taskkill /F /PID %FRONTEND_PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
    set FRONTEND_PID=
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr " 0.0.0.0:%FRONTEND_PORT% "') do set FRONTEND_PID=%%a
    if defined FRONTEND_PID (
        echo ERROR: Cannot free port %FRONTEND_PORT%
        echo TIP: Please close the application using this port manually
        set PORT_CONFLICT=1
    ) else (
        echo OK: Port %FRONTEND_PORT% freed successfully
    )
) else (
    echo OK: Port %FRONTEND_PORT% is available
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr " 0.0.0.0:%BACKEND_PORT% "') do set BACKEND_PID=%%a
if defined BACKEND_PID (
    echo WARNING: Port %BACKEND_PORT% is already in use ^(PID: %BACKEND_PID%^)
    echo   Attempting to stop the process...
    taskkill /F /PID %BACKEND_PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
    set BACKEND_PID=
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr " 0.0.0.0:%BACKEND_PORT% "') do set BACKEND_PID=%%a
    if defined BACKEND_PID (
        echo ERROR: Cannot free port %BACKEND_PORT%
        echo TIP: Please close the application using this port manually
        set PORT_CONFLICT=1
    ) else (
        echo OK: Port %BACKEND_PORT% freed successfully
    )
) else (
    echo OK: Port %BACKEND_PORT% is available
)

if %PORT_CONFLICT% equ 1 (
    echo.
    echo ERROR: Port conflicts detected. Please resolve manually.
    echo [%date% %time%] ERROR: Port conflicts >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [7/7] Starting Services...
echo [%date% %time%] Starting services >> %LOG_FILE%

echo Starting backend service...
start "QingTou-V6-Backend-LAN (Port %BACKEND_PORT%)" cmd /k "cd /d %~dp0apps\server && python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

timeout /t 2 /nobreak >nul

echo Starting frontend service...
start "QingTou-V6-Frontend-LAN (Port %FRONTEND_PORT%)" cmd /k "cd /d %~dp0 && pnpm dev --host"

echo.
echo ========================================
echo    Services Started Successfully!
echo ========================================
echo.
echo   Local Access (Computer):
echo     Frontend: http://localhost:%FRONTEND_PORT%
echo     Backend:  http://localhost:%BACKEND_PORT%
echo     API Docs: http://localhost:%BACKEND_PORT%/docs
echo.
echo   LAN Access (Mobile):
echo     Frontend: http://%LAN_IP%:%FRONTEND_PORT%
echo     Backend:  http://%LAN_IP%:%BACKEND_PORT%
echo.
echo   TIP: Use LAN URL on your mobile device
echo   TIP: Closing this window won't stop services
echo   TIP: Press Ctrl+C in each terminal to stop services
echo.

timeout /t 3 /nobreak >nul
start "" http://localhost:%FRONTEND_PORT%

echo [%date% %time%] Script completed >> %LOG_FILE%
exit /b 0
