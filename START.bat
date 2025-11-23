@echo off
title Word Editor - Starting...

echo ========================================
echo   WORD EDITOR - STARTING
echo ========================================
echo.

echo [1/3] Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] MongoDB dang chay
) else (
    echo [!] Dang khoi dong MongoDB...
    start "MongoDB" mongod --dbpath data\db
    timeout /t 3 >nul
)

echo.
echo [2/3] Starting servers...
start "Word Editor Servers" cmd /k "npm start"

echo.
echo [3/3] Waiting for servers to start...
timeout /t 10 >nul

echo.
echo ========================================
echo   SERVERS RUNNING!
echo ========================================
echo.
echo API Server:    https://wordserver.local:3000
echo WebDAV Server: https://wordserver.local:3001
echo React App:     http://localhost:5173
echo.
echo Mo browser: http://localhost:5173
echo.
echo De STOP servers, chay file STOP.bat
echo.

REM Auto-open browser
start http://localhost:5173

echo Cua so nay co the giu mo hoac dong lai.
echo Servers se chay trong cua so rieng.
echo.
pause
