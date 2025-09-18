@echo off
REM KryptoLuck Windows startup script
REM Makes it easy to run the application on Windows systems

echo 🎲 KryptoLuck - Windows Startup Script
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo ✅ npm is available

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo Available commands:
echo   1. run.bat offline   # Run offline mode
echo   2. run.bat online    # Run online mode  
echo   3. run.bat debug     # Run offline mode with debug logging
echo.

REM Parse command line argument
if "%1"=="offline" (
    echo 🔌 Starting KryptoLuck in offline mode...
    call npm run offline
    goto :end
)

if "%1"=="online" (
    echo 🌐 Starting KryptoLuck in online mode...
    if not exist ".env" (
        echo ⚠️  No .env file found. Online mode requires an Infura API key.
        echo 💡 Copy .example_env to .env and add your API key:
        echo    copy .example_env .env
        echo    # Edit .env and add your INFURA_KEY
        echo.
    )
    call npm run online
    goto :end
)

if "%1"=="debug" (
    echo 🐛 Starting KryptoLuck in offline mode with debug logging...
    set LOG_LEVEL=debug
    call npm run offline
    goto :end
)

echo ❓ Please specify a mode:
echo    run.bat offline
echo    run.bat online
echo    run.bat debug
pause

:end