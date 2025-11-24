@echo off
echo.
echo ============================================
echo   KIEM TRA CAU HINH HE THONG
echo ============================================
echo.

echo [1/6] Kiem tra hosts file...
findstr "wordserver.local" C:\Windows\System32\drivers\etc\hosts >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Hosts file co wordserver.local
) else (
    echo     [ERROR] Hosts file CHUA CO wordserver.local
)

echo.
echo [2/6] Kiem tra Trusted Location...
reg query "HKCU\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location99" >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Trusted Location99 ton tai
) else (
    reg query "HKCU\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location98" >nul 2>&1
    if %errorlevel% equ 0 (
        echo     [OK] Trusted Location98 ton tai
    ) else (
        echo     [ERROR] Trusted Location CHUA CO
    )
)

echo.
echo [3/6] Kiem tra Protected View...
reg query "HKCU\Software\Microsoft\Office\16.0\Word\Security\ProtectedView" /v DisableInternetFilesInPV >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Protected View da cau hinh
) else (
    echo     [ERROR] Protected View CHUA CAU HINH
)

echo.
echo [4/6] Kiem tra Network Locations...
reg query "HKCU\Software\Microsoft\Office\16.0\Word\Security" /v AllowNetworkLocations >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Network Locations da cau hinh
) else (
    echo     [ERROR] Network Locations CHUA CAU HINH
)

echo.
echo [5/6] Kiem tra Certificates...
if exist "%~dp0certs\wordserver.local.crt" (
    if exist "%~dp0certs\wordserver.local.key" (
        echo     [OK] Certificate files ton tai
    ) else (
        echo     [ERROR] Certificate KEY file KHONG TON TAI
    )
) else (
    echo     [ERROR] Certificate CRT file KHONG TON TAI
)

echo.
echo [6/6] Kiem tra mkcert CA...
certutil -store -user Root | findstr /i "mkcert" >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] mkcert CA da duoc cai dat
) else (
    echo     [ERROR] mkcert CA CHUA DUOC CAI
)

echo.
echo ============================================
echo   HOAN TAT KIEM TRA!
echo ============================================
echo.
pause
