# ============================================
# ADD TRUSTED LOCATION FOR WORD
# COMPREHENSIVE SETUP - ALL FIXES INCLUDED
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  WORD DESKTOP AUTO-SETUP (ALL FIXES)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Installing SSL Certificate..." -ForegroundColor Yellow

# Install SSL Certificate to Trusted Root (Fix for SSL warnings)
$scriptDir = Split-Path -Parent $PSScriptRoot
$certPath = Join-Path $scriptDir "certs\wordserver.local.crt"

if (Test-Path $certPath) {
    try {
        # Import to Trusted Root Certification Authorities
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
        $store.Open("ReadWrite")
        $store.Add($cert)
        $store.Close()
        Write-Host "    OK - SSL Certificate installed to Trusted Root" -ForegroundColor Green
    } catch {
        Write-Host "    WARNING - Certificate installation failed (may already exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "    WARNING - Certificate file not found at: $certPath" -ForegroundColor Yellow
}

Write-Host "[2/6] Disabling Protected View..." -ForegroundColor Yellow

# Disable Protected View
$protectedViewPath = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\ProtectedView"
if (-not (Test-Path $protectedViewPath)) {
    New-Item -Path $protectedViewPath -Force | Out-Null
}

Set-ItemProperty -Path $protectedViewPath -Name "DisableInternetFilesInPV" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $protectedViewPath -Name "DisableUnsafeLocationsInPV" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $protectedViewPath -Name "DisableAttachementsInPV" -Value 1 -Type DWord -Force

Write-Host "    OK - Protected View disabled" -ForegroundColor Green

Write-Host "[3/6] Enabling network locations..." -ForegroundColor Yellow

# Enable network locations
$trustedLocationsPath = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations"
if (-not (Test-Path $trustedLocationsPath)) {
    New-Item -Path $trustedLocationsPath -Force | Out-Null
}

Set-ItemProperty -Path $trustedLocationsPath -Name "AllowNetworkLocations" -Value 1 -Type DWord -Force

Write-Host "    OK - Network locations enabled" -ForegroundColor Green

Write-Host "[4/6] Adding Trusted Locations..." -ForegroundColor Yellow

# Add Trusted Location for API (port 3000)
$location99Path = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location99"
if (-not (Test-Path $location99Path)) {
    New-Item -Path $location99Path -Force | Out-Null
}

Set-ItemProperty -Path $location99Path -Name "Path" -Value "https://wordserver.local:3000/" -Type String -Force
Set-ItemProperty -Path $location99Path -Name "Description" -Value "Word Server Editor (API)" -Type String -Force
Set-ItemProperty -Path $location99Path -Name "AllowSubFolders" -Value 1 -Type DWord -Force

Write-Host "    OK - Trusted Location (API): https://wordserver.local:3000/" -ForegroundColor Green

# Add Trusted Location for WebDAV (port 3001)  
$location98Path = "HKCU:\Software\Microsoft\Office\16.0\Word\Security\Trusted Locations\Location98"
if (-not (Test-Path $location98Path)) {
    New-Item -Path $location98Path -Force | Out-Null
}

Set-ItemProperty -Path $location98Path -Name "Path" -Value "https://wordserver.local:3001/" -Type String -Force
Set-ItemProperty -Path $location98Path -Name "Description" -Value "Word WebDAV Server" -Type String -Force
Set-ItemProperty -Path $location98Path -Name "AllowSubFolders" -Value 1 -Type DWord -Force

Write-Host "    OK - Trusted Location (WebDAV): https://wordserver.local:3001/" -ForegroundColor Green

# Enable Web Folders for WebDAV
$webClientPath = "HKCU:\Software\Microsoft\Office\16.0\Common\Internet"
if (-not (Test-Path $webClientPath)) {
    New-Item -Path $webClientPath -Force | Out-Null
}

Set-ItemProperty -Path $webClientPath -Name "UseOnlineContent" -Value 1 -Type DWord -Force

Write-Host "    OK - Web folders enabled" -ForegroundColor Green

Write-Host "[5/6] Killing Word processes..." -ForegroundColor Yellow

# Kill all Word processes
$wordProcesses = Get-Process -Name "WINWORD" -ErrorAction SilentlyContinue
if ($wordProcesses) {
    $wordProcesses | Stop-Process -Force
    Write-Host "    OK - Closed Word windows" -ForegroundColor Green
} else {
    Write-Host "    OK - No Word running" -ForegroundColor Green
}

Write-Host "[6/6] Verifying..." -ForegroundColor Yellow

# Verify
$location = Get-ItemProperty -Path $location99Path -ErrorAction SilentlyContinue
$allowNetwork = (Get-ItemProperty -Path $trustedLocationsPath -Name "AllowNetworkLocations" -ErrorAction SilentlyContinue).AllowNetworkLocations

Write-Host ""
Write-Host "Settings:" -ForegroundColor Cyan
Write-Host "  Trusted: $($location.Path)" -ForegroundColor White
Write-Host "  Subfolders: $($location.AllowSubFolders)" -ForegroundColor White
Write-Host "  Network: $allowNetwork" -ForegroundColor White

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETED!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "What was configured:" -ForegroundColor Cyan
Write-Host "  [1/6] SSL Certificate -> Trusted Root (no more SSL warnings)" -ForegroundColor Green
Write-Host "  [2/6] Protected View -> Disabled" -ForegroundColor Green
Write-Host "  [3/6] Network Locations -> Enabled" -ForegroundColor Green
Write-Host "  [4/6] Trusted Locations -> Added (3000 + 3001)" -ForegroundColor Green
Write-Host "  [5/6] Word Processes -> Closed" -ForegroundColor Green
Write-Host "  [6/6] Web Folders -> Enabled" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT - NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. RESTART YOUR COMPUTER (Required!)" -ForegroundColor Yellow
Write-Host "  2. After restart, open browser:" -ForegroundColor White
Write-Host "     http://localhost:5173" -ForegroundColor White
Write-Host "  3. Upload a Word file" -ForegroundColor White
Write-Host "  4. Click Edit button" -ForegroundColor White
Write-Host "  5. Word opens -> Edit -> Ctrl+S -> Auto-save!" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Cyan
Write-Host "  - If browser can't upload: Accept SSL certificates" -ForegroundColor White
Write-Host "    https://wordserver.local:3000 (click Advanced -> Proceed)" -ForegroundColor White
Write-Host "    https://wordserver.local:3001 (click Advanced -> Proceed)" -ForegroundColor White
Write-Host ""

# pause - Removed: Causes Electron app to hang waiting for script to finish
