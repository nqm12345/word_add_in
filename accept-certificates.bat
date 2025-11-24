@echo off
echo ============================================
echo  ACCEPT SSL CERTIFICATES
echo ============================================
echo.
echo Mo cac URL de accept SSL certificates...
echo.

REM Mo API Server
start https://wordserver.local:3000

timeout /t 2 /nobreak >nul

REM Mo WebDAV Server
start https://wordserver.local:3001

echo.
echo ============================================
echo  HUONG DAN:
echo ============================================
echo.
echo Tren moi tab:
echo 1. Click "Advanced"
echo 2. Click "Proceed to wordserver.local (unsafe)"
echo.
echo Sau do quay lai Web App va refresh!
echo.
pause
