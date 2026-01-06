# Step-by-step script to upload videos to Railway Volume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Upload Videos to Railway - Step by Step" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Cyan
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue
if ($hasRailway) {
    Write-Host "  Railway CLI: Installed" -ForegroundColor Green
} else {
    Write-Host "  Railway CLI: Not found - Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check login
Write-Host ""
Write-Host "Step 2: Checking Railway login..." -ForegroundColor Cyan
railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Login: OK" -ForegroundColor Green
    $isLoggedIn = $true
} else {
    Write-Host "  Login: Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Please run: railway login" -ForegroundColor White
    $isLoggedIn = $false
}

# Check project link
Write-Host ""
Write-Host "Step 3: Checking Railway project..." -ForegroundColor Cyan
if ($isLoggedIn) {
    railway status 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Project: Linked" -ForegroundColor Green
        $isLinked = $true
    } else {
        Write-Host "  Project: Not linked" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Please run: railway link" -ForegroundColor White
        $isLinked = $false
    }
} else {
    $isLinked = $false
}

# Check video files
Write-Host ""
Write-Host "Step 4: Checking video files..." -ForegroundColor Cyan
$videosDir = "server/uploads/videos"
if (Test-Path $videosDir) {
    $videoFiles = Get-ChildItem -Path $videosDir -Filter "*.mp4"
    Write-Host "  Found: $($videoFiles.Count) video files" -ForegroundColor Green
    $videoFiles | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "    - $($_.Name) ($sizeMB MB)" -ForegroundColor Gray
    }
} else {
    Write-Host "  Error: Videos directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  Next Steps" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

if (-not $isLoggedIn) {
    Write-Host "1. Login to Railway:" -ForegroundColor Cyan
    Write-Host "   railway login" -ForegroundColor White
    Write-Host ""
}

if (-not $isLinked) {
    Write-Host "2. Link Railway project:" -ForegroundColor Cyan
    Write-Host "   railway link" -ForegroundColor White
    Write-Host "   (Select: pim-learning-platform)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "3. Create Railway Volume:" -ForegroundColor Cyan
Write-Host "   a. Go to: https://railway.app/dashboard" -ForegroundColor White
Write-Host "   b. Select project: pim-learning-platform" -ForegroundColor White
Write-Host "   c. Go to: Volumes" -ForegroundColor White
Write-Host "   d. Click: New Volume" -ForegroundColor White
Write-Host "   e. Name: video-files" -ForegroundColor White
Write-Host "   f. Mount path: /app/server/uploads/videos" -ForegroundColor White
Write-Host "   g. Create Volume" -ForegroundColor White
Write-Host ""

Write-Host "4. Upload files (Choose ONE method):" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Method 1: Railway Dashboard (Easiest)" -ForegroundColor Green
Write-Host "   - Go to Volumes -> Click your volume" -ForegroundColor White
Write-Host "   - Use File Manager to upload files" -ForegroundColor White
Write-Host "   - Upload all 11 files from: server/uploads/videos/" -ForegroundColor White
Write-Host ""
Write-Host "   Method 2: Railway CLI" -ForegroundColor Yellow
Write-Host "   - Run: railway volume mount" -ForegroundColor White
Write-Host "   - Copy files to mount path shown" -ForegroundColor White
Write-Host "   - Example: cp server/uploads/videos/*.mp4 /tmp/railway-volume-xxxxx/" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Verify upload:" -ForegroundColor Cyan
Write-Host "   node server/scripts/check-backend-videos.js" -ForegroundColor White
Write-Host "   (Should see: realVideoFileCount: 11)" -ForegroundColor Gray
Write-Host ""

