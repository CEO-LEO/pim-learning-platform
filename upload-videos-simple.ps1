# Simple script to upload videos to Railway
Write-Host "Upload Videos to Railway" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue

if (-not $hasRailway) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

Write-Host "Checking Railway login..." -ForegroundColor Yellow
railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Railway:" -ForegroundColor Red
    Write-Host "  railway login" -ForegroundColor White
    exit 1
}

Write-Host "Checking project..." -ForegroundColor Yellow
railway status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please link Railway project:" -ForegroundColor Red
    Write-Host "  railway link" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "IMPORTANT: Create Railway Volume first!" -ForegroundColor Yellow
Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
Write-Host "  2. Create Volume" -ForegroundColor White
Write-Host "  3. Mount path: /app/server/uploads/videos" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Volume created? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Please create volume first" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Mounting volume..." -ForegroundColor Yellow
Write-Host "Note the mount path shown below" -ForegroundColor Gray
Write-Host ""

railway volume mount

Write-Host ""
Write-Host "After mounting, copy files:" -ForegroundColor Cyan
Write-Host "  cp server/uploads/videos/*.mp4 <mount-path>" -ForegroundColor White
Write-Host ""

