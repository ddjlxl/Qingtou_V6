@echo off

title QingTou V6 - Quick Start

set "FRONTEND_PORT=9527"
set "BACKEND_PORT=9528"
set "FRONTEND_URL=http://localhost:9527"
set "BACKEND_URL=http://localhost:9528"
set "LOG_FILE=startup.log"

echo.
echo ========================================
echo    QingTou V6 - Quick Start Script
echo ========================================
echo.

echo [%date% %time%] Script started > %LOG_FILE%

echo [1/6] Checking Node.js...
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
echo [2/6] Checking pnpm...
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
echo [3/6] Checking Python...
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
echo [4/6] Checking dependencies...
if not exist "node_modules" (
    echo node_modules not found, installing frontend dependencies...
    echo [%date% %time%] Installing frontend dependencies >> %LOG_FILE%
    call pnpm install
    if %errorlevel% neq 0 (
        echo ERROR: Frontend dependencies installation failed
        echo [%date% %time%] ERROR: Frontend dependencies failed >> %LOG_FILE%
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo OK: Frontend dependencies installed
    echo [%date% %time%] Frontend dependencies installed >> %LOG_FILE%
) else (
    echo OK: Frontend dependencies already installed
    echo [%date% %time%] Frontend dependencies exist >> %LOG_FILE%
)

if not exist "apps\server\.installed" (
    echo Installing backend dependencies...
    echo [%date% %time%] Installing backend dependencies >> %LOG_FILE%
    cd apps\server
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERROR: Backend dependencies installation failed
        echo [%date% %time%] ERROR: Backend dependencies failed >> %LOG_FILE%
        cd ..\..
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo. > .installed
    cd ..\..
    echo OK: Backend dependencies installed
    echo [%date% %time%] Backend dependencies installed >> %LOG_FILE%
) else (
    echo OK: Backend dependencies already installed
    echo [%date% %time%] Backend dependencies exist >> %LOG_FILE%
)

echo.
echo [5/6] Checking port availability...
netstat -ano | findstr "LISTENING" | findstr ":%FRONTEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ERROR: Port %FRONTEND_PORT% is already in use
    echo TIP: Close the program using this port or change port in script
    echo [%date% %time%] ERROR: Port %FRONTEND_PORT% in use >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo OK: Port %FRONTEND_PORT% is available
    echo [%date% %time%] Port %FRONTEND_PORT% available >> %LOG_FILE%
)

netstat -ano | findstr "LISTENING" | findstr ":%BACKEND_PORT%" >nul 2>&1
if %errorlevel% equ 0 (
    echo ERROR: Port %BACKEND_PORT% is already in use
    echo TIP: Close the program using this port or change port in script
    echo [%date% %time%] ERROR: Port %BACKEND_PORT% in use >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo OK: Port %BACKEND_PORT% is available
    echo [%date% %time%] Port %BACKEND_PORT% available >> %LOG_FILE%
)

if exist "apps\server\.env" (
    echo OK: Backend .env config exists
    echo [%date% %time%] Backend .env exists >> %LOG_FILE%
) else (
    echo WARNING: Backend .env not found, copy .env.example to .env first
    echo [%date% %time%] WARNING: Backend .env not found >> %LOG_FILE%
)

echo.
echo ========================================
echo    Select Startup Mode
echo ========================================
echo.
echo   [1] Start Frontend Only
echo   [2] Start Backend Only
echo   [3] Start Both Frontend and Backend
echo   [4] Install/Update Dependencies
echo   [5] Run Code Lint
echo   [6] Run Tests
echo   [7] View Project Status
echo   [0] Exit
echo.
set /p choice="Enter your choice (0-7): "

if "%choice%"=="1" goto start_frontend
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto install_deps
if "%choice%"=="5" goto run_lint
if "%choice%"=="6" goto run_test
if "%choice%"=="7" goto show_status
if "%choice%"=="0" goto end_script
goto invalid_choice

:start_frontend
echo.
echo [6/6] Starting Frontend Service...
echo [%date% %time%] Starting frontend >> %LOG_FILE%
echo.
echo Frontend service starting...
echo Access URL: %FRONTEND_URL%
echo Press Ctrl+C to stop
echo.
timeout /t 2 /nobreak >nul
start "" %FRONTEND_URL%
call pnpm dev
goto end_script

:start_backend
echo.
echo [6/6] Starting Backend Service...
echo [%date% %time%] Starting backend >> %LOG_FILE%
echo.
echo Backend service starting...
echo API URL: %BACKEND_URL%
echo API Docs: %BACKEND_URL%/docs
echo Press Ctrl+C to stop
echo.
timeout /t 2 /nobreak >nul
start "" %BACKEND_URL%/docs
cd apps\server
python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload
goto end_script

:start_both
echo.
echo [6/6] Starting Both Services...
echo [%date% %time%] Starting both services >> %LOG_FILE%
echo.
echo Starting backend service...
start "QingTou-V6-Backend (Port %BACKEND_PORT%)" cmd /k "cd /d %~dp0apps\server && python -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

echo Starting frontend service...
start "QingTou-V6-Frontend (Port %FRONTEND_PORT%)" cmd /k "cd /d %~dp0 && pnpm dev"

echo.
echo ========================================
echo    Services Started Successfully!
echo ========================================
echo.
echo   Frontend: %FRONTEND_URL%
echo   Backend: %BACKEND_URL%
echo   API Docs: %BACKEND_URL%/docs
echo.
echo TIP: Closing this window won't stop services
echo TIP: Press Ctrl+C in each terminal to stop services
echo TIP: Or run stop.bat to stop all services
echo.

timeout /t 3 /nobreak >nul
start "" %FRONTEND_URL%
goto end_script

:install_deps
echo.
echo Installing/Updating Dependencies...
echo [%date% %time%] Installing dependencies >> %LOG_FILE%
echo.
echo Installing frontend dependencies...
call pnpm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend dependencies installation failed
    echo [%date% %time%] ERROR: Frontend dependencies failed >> %LOG_FILE%
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo OK: Frontend dependencies installed
echo.
echo Installing backend dependencies...
cd apps\server
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Backend dependencies installation failed
    echo [%date% %time%] ERROR: Backend dependencies failed >> %LOG_FILE%
    cd ..\..
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)
echo. > .installed
cd ..\..
echo OK: Backend dependencies installed
echo.
echo OK: All dependencies installed
echo [%date% %time%] All dependencies installed >> %LOG_FILE%
echo.
echo Press any key to return...
pause >nul
goto end_script

:run_lint
echo.
echo Running Code Lint...
echo [%date% %time%] Running lint >> %LOG_FILE%
call pnpm lint
echo.
echo Code lint completed
echo [%date% %time%] Lint completed >> %LOG_FILE%
echo.
echo Press any key to return...
pause >nul
goto end_script

:run_test
echo.
echo Running Tests...
echo [%date% %time%] Running tests >> %LOG_FILE%
call pnpm test
echo.
echo Tests completed
echo [%date% %time%] Tests completed >> %LOG_FILE%
echo.
echo Press any key to return...
pause >nul
goto end_script

:show_status
echo.
echo ========================================
echo    Project Status
echo ========================================
echo.
echo   Node.js Version: %NODE_VERSION%
echo   pnpm Version: %PNPM_VERSION%
echo   Python Version: %PYTHON_VERSION%
echo.
echo   Frontend Port: %FRONTEND_PORT%
echo   Backend Port: %BACKEND_PORT%
echo.
if exist "node_modules" (
    echo   Frontend Dependencies: Installed
) else (
    echo   Frontend Dependencies: Not Installed
)
if exist "apps\server\.installed" (
    echo   Backend Dependencies: Installed
) else (
    echo   Backend Dependencies: Not Installed
)
if exist "apps\server\.env" (
    echo   Database Config: .env exists
) else (
    echo   Database Config: .env not found (copy from .env.example)
)
echo.
echo ========================================
echo.
echo Press any key to return...
pause >nul
goto end_script

:invalid_choice
echo.
echo ERROR: Invalid choice, please run the script again
echo [%date% %time%] ERROR: Invalid choice >> %LOG_FILE%
echo.
echo Press any key to exit...
pause >nul
goto end_script

:end_script
echo.
echo [%date% %time%] Script completed >> %LOG_FILE%
exit /b 0
