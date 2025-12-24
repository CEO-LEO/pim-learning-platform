@echo off
cd /d "%~dp0"
echo Starting Next.js development server...
echo.
start "Next.js Dev Server" cmd /k "npm run dev"
timeout /t 15 /nobreak >nul
echo.
echo Checking server status...
netstat -ano | findstr :3000
if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo SUCCESS! Server is running!
    echo Open http://localhost:3000 in your browser
    echo ========================================
) else (
    echo.
    echo Server is still starting... Please wait a moment and refresh your browser.
)
pause
