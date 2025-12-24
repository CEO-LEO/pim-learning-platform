@echo off
echo Starting PIM Learning Platform Development Servers...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Start server in a new window
echo Starting Backend Server on port 5000...
start "PIM Server" cmd /k "cd server && npm start"

REM Wait a bit for server to start
timeout /t 3 /nobreak >nul

REM Start client in a new window
echo Starting React Client on port 3000...
start "PIM Client" cmd /k "cd client && npm start"

echo.
echo Both servers are starting...
echo Backend Server: http://localhost:5000
echo React Client: http://localhost:3000
echo.
echo Press any key to exit (servers will continue running)...
pause >nul

