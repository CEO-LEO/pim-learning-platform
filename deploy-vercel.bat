@echo off
echo 🚀 PIM Learning Platform - Vercel Deployment
echo ==========================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Vercel CLI not found. Installing...
    call npm install -g vercel
)

echo ✓ Vercel CLI ready
echo.

REM Check if logged in
vercel whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Vercel:
    call vercel login
)

echo.
echo 📋 Step 1: Deploy Backend (Railway/Render)
echo Please deploy backend first:
echo   1. Go to https://railway.app or https://render.com
echo   2. Create new project
echo   3. Deploy from GitHub
echo   4. Set Root Directory: server
echo   5. Set Environment Variables
echo.
set /p BACKEND_URL="Enter your Backend URL (e.g., https://xxx.railway.app): "

if "%BACKEND_URL%"=="" (
    echo ❌ Backend URL is required
    pause
    exit /b 1
)

REM Remove trailing slash
set BACKEND_URL=%BACKEND_URL:"=%
set API_URL=%BACKEND_URL%/api

echo.
echo 📋 Step 2: Deploy Frontend (Vercel)
echo.

REM Go to client directory
cd client

REM Set environment variable
set REACT_APP_API_URL=%API_URL%

echo Building React app...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✓ Build successful
echo.

REM Deploy to Vercel
echo Deploying to Vercel...
call vercel --prod --env REACT_APP_API_URL=%API_URL%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment successful!
    echo.
    echo 📋 Next steps:
    echo   1. Set REACT_APP_API_URL in Vercel Dashboard: %API_URL%
    echo   2. Update CORS in backend to allow Vercel domain
    echo   3. Test your application
) else (
    echo ❌ Deployment failed
)

pause

