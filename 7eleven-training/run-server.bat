@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo Starting Next.js Development Server
echo ========================================
echo.
echo Please wait while the server starts...
echo.
call npm run dev
pause
