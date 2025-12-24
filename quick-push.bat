@echo off
echo ========================================
echo PIM Learning Platform - Quick Push
echo ========================================
echo.

echo Step 1: Create GitHub repository first
echo Go to: https://github.com/new
echo Repository name: pim-learning-platform
echo Do NOT check "Initialize with README"
echo Click "Create repository"
echo.
pause

echo.
echo Step 2: Enter your GitHub repository URL
set /p REPO_URL="Enter URL (e.g. https://github.com/CEO-LEO/pim-learning-platform.git): "

if "%REPO_URL%"=="" (
    echo Error: No URL provided
    pause
    exit /b 1
)

echo.
echo Adding remote...
git remote add origin %REPO_URL% 2>nul
if errorlevel 1 (
    git remote set-url origin %REPO_URL%
)

echo.
echo Pushing code...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ERROR: Push failed
    echo.
    echo If GitHub asks for Username/Password:
    echo - Username: Your GitHub username
    echo - Password: Use Personal Access Token
    echo - Create Token: https://github.com/settings/tokens
    echo.
) else (
    echo.
    echo SUCCESS! Code pushed to GitHub
    echo.
    echo Next steps:
    echo 1. Go to Vercel: https://vercel.com/new
    echo 2. Refresh page (F5)
    echo 3. You should see pim-learning-platform in the list
    echo 4. Click Import
    echo.
)

pause

