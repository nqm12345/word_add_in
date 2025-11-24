# ============================================
# KIỂM TRA SETUP HOÀN CHỈNH
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  KIỂM TRA CẤU HÌNH HỆ THỐNG" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$allOK = $true

# ============================================
# 1. KIỂM TRA HOSTS FILE
# ============================================
Write-Host "[1/6] Kiểm tra hosts file..." -ForegroundColor Yellow

$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue

if ($hostsContent -match "127.0.0.1\s+wordserver.local") {
    Write-Host "    ✓ Hosts file OK: 127.0.0.1 wordserver.local" -ForegroundColor Green
} else {
    Write-Host "    ✗ Hosts file CHƯA CÓ: wordserver.local" -ForegroundColor Red
    $allOK = $false
}

# ============================================
# 2. KIỂM TRA WORD REGISTRY - TRUSTED LOCATIONS
# ============================================
Write-Host "[2/6] Kiểm tra Word Trusted Locations..." -ForegroundColor Yellow

$regPaths = @(
    "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location99",
    "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location98"
)

$foundTrusted = $false
foreach ($regPath in $regPaths) {
    if (Test-Path $regPath) {
        $path = (Get-ItemProperty -Path $regPath -Name Path -ErrorAction SilentlyContinue).Path
        if ($path -like "*wordserver.local*") {
            Write-Host "    ✓ Trusted Location OK: $path" -ForegroundColor Green
            $foundTrusted = $true
            break
        }
    }
}

if (-not $foundTrusted) {
    Write-Host "    ✗ Trusted Location CHƯA CÓ" -ForegroundColor Red
    $allOK = $false
}

# ============================================
# 3. KIỂM TRA PROTECTED VIEW
# ============================================
Write-Host "[3/6] Kiểm tra Protected View..." -ForegroundColor Yellow

$pvPath = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\ProtectedView"
if (Test-Path $pvPath) {
    $disable1 = (Get-ItemProperty -Path $pvPath -Name DisableInternetFilesInPV -ErrorAction SilentlyContinue).DisableInternetFilesInPV
    $disable2 = (Get-ItemProperty -Path $pvPath -Name DisableUnsafeLocationsInPV -ErrorAction SilentlyContinue).DisableUnsafeLocationsInPV
    
    if ($disable1 -eq 1 -and $disable2 -eq 1) {
        Write-Host "    ✓ Protected View: Disabled" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Protected View: CHƯA DISABLE" -ForegroundColor Red
        $allOK = $false
    }
} else {
    Write-Host "    ✗ Protected View: CHƯA CẤU HÌNH" -ForegroundColor Red
    $allOK = $false
}

# ============================================
# 4. KIỂM TRA NETWORK LOCATIONS
# ============================================
Write-Host "[4/6] Kiểm tra Network Locations..." -ForegroundColor Yellow

$secPath = "HKCU:\Software\Microsoft\Office\16.0\Word\Security"
if (Test-Path $secPath) {
    $allowNet = (Get-ItemProperty -Path $secPath -Name AllowNetworkLocations -ErrorAction SilentlyContinue).AllowNetworkLocations
    
    if ($allowNet -eq 1) {
        Write-Host "    ✓ Network Locations: Enabled" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Network Locations: CHƯA ENABLE" -ForegroundColor Red
        $allOK = $false
    }
} else {
    Write-Host "    ✗ Network Locations: CHƯA CẤU HÌNH" -ForegroundColor Red
    $allOK = $false
}

# ============================================
# 5. KIỂM TRA SSL CERTIFICATES
# ============================================
Write-Host "[5/6] Kiểm tra SSL Certificates..." -ForegroundColor Yellow

# Check certificates exist
$certsPath = "$PSScriptRoot\certs"
$crtFile = Join-Path $certsPath "wordserver.local.crt"
$keyFile = Join-Path $certsPath "wordserver.local.key"

if ((Test-Path $crtFile) -and (Test-Path $keyFile)) {
    Write-Host "    ✓ Certificate files tồn tại" -ForegroundColor Green
    
    # Check certificate in Windows Store
    $cert = Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object { $_.Subject -like "*wordserver.local*" -or $_.Issuer -like "*mkcert*" }
    
    if ($cert) {
        Write-Host "    ✓ Certificate trong Windows Store: OK" -ForegroundColor Green
    } else {
        Write-Host "    ⚠ Certificate CHƯA CÓ trong Windows Store" -ForegroundColor Yellow
        Write-Host "      (Có thể cần chạy: mkcert -install)" -ForegroundColor Yellow
    }
} else {
    Write-Host "    ✗ Certificate files KHÔNG TỒN TẠI" -ForegroundColor Red
    Write-Host "      Cần chạy: mkcert wordserver.local localhost 127.0.0.1 ::1" -ForegroundColor Yellow
    $allOK = $false
}

# ============================================
# 6. KIỂM TRA mkcert CA
# ============================================
Write-Host "[6/6] Kiểm tra mkcert CA..." -ForegroundColor Yellow

$mkcertCA = Get-ChildItem -Path Cert:\CurrentUser\Root | Where-Object { $_.Subject -like "*mkcert*" }

if ($mkcertCA) {
    Write-Host "    ✓ mkcert CA đã được cài đặt" -ForegroundColor Green
    Write-Host "      Issuer: $($mkcertCA.Subject)" -ForegroundColor Gray
} else {
    Write-Host "    ✗ mkcert CA CHƯA ĐƯỢC CÀI" -ForegroundColor Red
    Write-Host "      Cần chạy: mkcert -install" -ForegroundColor Yellow
    $allOK = $false
}

# ============================================
# KẾT QUẢ TỔNG
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

if ($allOK) {
    Write-Host "  ✓ TẤT CẢ CẤU HÌNH OK!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Hệ thống đã sẵn sàng!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Các bước tiếp theo:" -ForegroundColor Yellow
    Write-Host "  1. Khởi động servers (API, WebDAV, Client)" -ForegroundColor White
    Write-Host "  2. Mở browser: http://localhost:5173" -ForegroundColor White
    Write-Host "  3. Upload và edit files" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ✗ CÒN VẤN ĐỀ CẦN KHẮC PHỤC!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Khắc phục:" -ForegroundColor Yellow
    Write-Host "  1. Chạy Word Setup Tool as Administrator" -ForegroundColor White
    Write-Host "  2. Restart máy sau khi setup" -ForegroundColor White
    Write-Host "  3. Chạy lại script này để kiểm tra" -ForegroundColor White
    Write-Host ""
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
