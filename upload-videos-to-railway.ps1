# PowerShell script to upload video files to Railway
# This script helps upload actual video files to Railway Volume

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Video Files to Railway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue

if (-not $hasRailway) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "Railway CLI installed" -ForegroundColor Green
}

Write-Host "Checking Railway login..." -ForegroundColor Yellow
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Railway. Please login:" -ForegroundColor Red
    Write-Host "  railway login" -ForegroundColor White
    exit 1
}

Write-Host "Checking Railway project..." -ForegroundColor Yellow
railway status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not linked to Railway project. Please link:" -ForegroundColor Red
    Write-Host "  railway link" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "IMPORTANT: Railway Volume must be created first!" -ForegroundColor Yellow
Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
Write-Host "  2. Create Volume (if not exists)" -ForegroundColor White
Write-Host "  3. Mount path: /app/server/uploads/videos" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you created the volume? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Please create the volume first" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Mounting Railway volume..." -ForegroundColor Yellow
Write-Host "This will show you the mount path" -ForegroundColor Gray
Write-Host ""

railway volume mount

Write-Host ""
Write-Host "After mounting, copy video files to the mounted path:" -ForegroundColor Cyan
Write-Host "  Example: cp server/uploads/videos/*.mp4 /tmp/railway-volume-xxxxx/" -ForegroundColor White
Write-Host ""
Write-Host "Or use Railway Dashboard File Manager to upload files" -ForegroundColor Cyan
Write-Host ""

