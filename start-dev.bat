@echo off
REM Kakao Maps Dev Server Startup Script
REM Ensures environment variables are loaded correctly

echo ====================================
echo  Kakao Maps DateLog - Dev Server
echo ====================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env file with VITE_KAKAO_MAP_API_KEY
    echo.
    pause
    exit /b 1
)

REM Display environment info
echo [INFO] Checking environment configuration...
echo.

REM Check if API key is in .env
findstr "VITE_KAKAO_MAP_API_KEY" .env >nul
if %errorlevel% equ 0 (
    echo [OK] VITE_KAKAO_MAP_API_KEY found in .env
) else (
    echo [ERROR] VITE_KAKAO_MAP_API_KEY not found in .env
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] Starting Vite dev server...
echo [INFO] The app will be available at http://localhost:5173
echo.
echo [TIP] If you see "지도 로드 실패" error:
echo   1. Check browser console (F12) for detailed error
echo   2. Verify Kakao Developer Console settings
echo   3. Check platform domain registration
echo.

REM Start the dev server
npm run dev
