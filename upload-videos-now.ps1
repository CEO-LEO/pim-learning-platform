# Upload videos to Railway Volume - Complete automation
Write-Host "Uploading Videos to Railway Volume" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue
if (-not $hasRailway) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check login
Write-Host "Checking Railway login..." -ForegroundColor Yellow
railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login first: railway login" -ForegroundColor Red
    exit 1
}

# Check project
Write-Host "Checking Railway project..." -ForegroundColor Yellow
railway status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please link project first: railway link" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "IMPORTANT: Create Railway Volume first!" -ForegroundColor Yellow
Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
Write-Host "  2. Create Volume with mount path: /app/server/uploads/videos" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Volume created? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Please create volume first" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Method 1: Using Railway Dashboard (Easiest)" -ForegroundColor Cyan
Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
Write-Host "  2. Click on your volume" -ForegroundColor White
Write-Host "  3. Use File Manager to upload files from: server/uploads/videos/" -ForegroundColor White
Write-Host ""

Write-Host "Method 2: Using Railway CLI" -ForegroundColor Cyan
Write-Host "  Run: railway volume mount" -ForegroundColor White
Write-Host "  Then copy files to the mount path shown" -ForegroundColor White
Write-Host ""

Write-Host "Files to upload (11 files):" -ForegroundColor Yellow
Get-ChildItem -Path "server/uploads/videos" -Filter "*.mp4" | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1MB, 2)) MB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "After uploading, verify with:" -ForegroundColor Cyan
Write-Host "  node server/scripts/check-backend-videos.js" -ForegroundColor White
Write-Host ""

