@echo off
echo ========================================
echo   WORD EDITOR - EASY SETUP
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Vui long chay script nay voi quyen Administrator!
    echo Right-click -> Run as administrator
    pause
    exit /b 1
)

echo [1/6] Checking Node.js...
where node >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Node.js da duoc cai dat
) else (
    echo [!] Node.js chua duoc cai dat
    echo Vui long cai Node.js tu: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo [2/6] Checking MongoDB...
where mongod >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] MongoDB da duoc cai dat
) else (
    echo [!] MongoDB chua duoc cai dat
    echo Vui long cai MongoDB tu: https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)

echo.
echo [3/6] Installing dependencies...
call npm run install-all
if %errorLevel% neq 0 (
    echo [ERROR] Loi khi cai dependencies
    pause
    exit /b 1
)

echo.
echo [4/6] Checking SSL certificates...
if exist "certs\wordserver.local.crt" (
    echo [OK] SSL certificates da ton tai
) else (
    echo [!] SSL certificates chua duoc tao
    echo Vui long chay lenh sau trong folder certs:
    echo   mkcert wordserver.local
    echo   rename wordserver.local.pem wordserver.local.crt
    echo   rename wordserver.local-key.pem wordserver.local.key
    pause
    exit /b 1
)

echo.
echo [5/6] Checking hosts file...
findstr /C:"wordserver.local" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Hosts file da duoc cap nhat
) else (
    echo [!] Dang cap nhat hosts file...
    echo 127.0.0.1 wordserver.local >> C:\Windows\System32\drivers\etc\hosts
    echo [OK] Hosts file da duoc cap nhat
)

echo.
echo [6/6] Setup Word Desktop...
echo Dang chay script setup Word...
powershell -ExecutionPolicy Bypass -File "ADD_TRUSTED_LOCATION.ps1"

echo.
echo ========================================
echo   SETUP HOAN TAT!
echo ========================================
echo.
echo Ban co the chay du an bang lenh:
echo   npm start
echo.
echo Sau do mo browser: http://localhost:5173
echo.
echo [!] QUAN TRONG: Neu Word van hien "Read-only",
echo     vui long RESTART MAY!
echo.
pause
