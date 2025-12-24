@echo off
echo 🚀 Starting PIM Learning Platform Deployment...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

echo ✓ Node.js is installed
echo.

REM Build Frontend
echo 📦 Building Frontend...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)
echo ✓ Frontend build successful
cd ..

echo.
echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo   1. Start backend: cd server ^&^& npm start
echo   2. Test frontend: http://localhost:3000
echo   3. Test backend: http://localhost:5000
echo.
pause

