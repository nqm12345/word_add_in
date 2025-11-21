@echo off
echo.
echo ============================================
echo   KIEM TRA TRUSTED LOCATIONS
echo ============================================
echo.
echo Checking registry...
echo.

reg query "HKCU\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations" /s

echo.
echo ============================================
echo.
echo Kiem tra xem co dong nao chua:
echo   Path = https://wordserver.local:3000
echo.
echo Neu KHONG CO --> Can them lai!
echo.
pause
