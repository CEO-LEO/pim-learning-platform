# 🎥 Auto Fix Video LFS Pointer Issue
# สคริปต์นี้จะช่วยแก้ไขปัญหา LFS pointer อัตโนมัติ

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎥 Auto Fix Video Storage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Railway CLI
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Yellow
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
}
Write-Host ""

# Step 2: Check login
Write-Host "Step 2: Checking Railway login..." -ForegroundColor Yellow
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please login first:" -ForegroundColor Yellow
    Write-Host "  railway login" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Logged in to Railway" -ForegroundColor Green
Write-Host ""

# Step 3: Check project link
Write-Host "Step 3: Checking project link..." -ForegroundColor Yellow
$projectCheck = railway status 2>&1
if ($LASTEXITCODE -ne 0 -or $projectCheck -match "No project linked") {
    Write-Host "⚠️  No project linked. Linking..." -ForegroundColor Yellow
    railway link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Step 4: Check video files
Write-Host "Step 4: Checking video files..." -ForegroundColor Yellow
$sourceDir = Join-Path $PSScriptRoot "server\uploads\videos"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Video directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}

$videoFiles = Get-ChildItem -Path $sourceDir -Include *.mp4,*.webm,*.mov -File
$videoCount = $videoFiles.Count

if ($videoCount -eq 0) {
    Write-Host "❌ No video files found" -ForegroundColor Red
    exit 1
}

$totalSize = ($videoFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeGB = [math]::Round($totalSize / 1GB, 2)

Write-Host "✅ Found $videoCount video files ($totalSizeGB GB)" -ForegroundColor Green
Write-Host ""

# Step 5: Check for LFS pointers
Write-Host "Step 5: Checking for LFS pointers..." -ForegroundColor Yellow
node server/scripts/check-video-files.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All files are real video files (no LFS pointers)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Found LFS pointer files" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Instructions for Railway Volume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📋 Next Steps (Manual)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Since Railway CLI does not support direct file upload," -ForegroundColor Yellow
Write-Host "you need to create Volume and upload files manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to Railway Dashboard:" -ForegroundColor Cyan
Write-Host "   https://railway.app - Your Project - Volumes" -ForegroundColor White
Write-Host ""
Write-Host "2. Create New Volume:" -ForegroundColor Cyan
Write-Host "   - Name: video-storage" -ForegroundColor White
Write-Host "   - Size: 10 GB" -ForegroundColor White
Write-Host "   - Mount Path: /app/server/uploads/videos" -ForegroundColor White
Write-Host "   - Click Create button" -ForegroundColor White
Write-Host ""
Write-Host "3. Upload Files:" -ForegroundColor Cyan
Write-Host "   - Click on the volume you created" -ForegroundColor White
Write-Host "   - Click Upload Files or Browse button" -ForegroundColor White
Write-Host "   - Select all files from: $sourceDir" -ForegroundColor White
Write-Host "   - Wait for upload to complete" -ForegroundColor White
Write-Host ""
Write-Host "4. Restart Service:" -ForegroundColor Cyan
Write-Host "   - Go to Deployments" -ForegroundColor White
Write-Host "   - Click Redeploy or restart service" -ForegroundColor White
Write-Host ""
Write-Host "5. Verify:" -ForegroundColor Cyan
Write-Host "   railway shell" -ForegroundColor White
Write-Host "   ls -lh /app/server/uploads/videos/" -ForegroundColor White
Write-Host ""

# Step 7: Alternative - Use volume mount
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔧 Alternative: Volume Mount" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you prefer using CLI, you can mount volume:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Mount volume:" -ForegroundColor Cyan
Write-Host "   railway volume mount" -ForegroundColor White
Write-Host "   (Note the mounted path, e.g., /tmp/railway-volume-xxxxx)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Copy files:" -ForegroundColor Cyan
Write-Host "   Copy-Item `"$sourceDir\*`" -Destination `"<mounted-path>`" -Recurse" -ForegroundColor White
Write-Host ""
Write-Host "3. Unmount:" -ForegroundColor Cyan
Write-Host "   (Press Ctrl+C or close terminal)" -ForegroundColor White
Write-Host ""

# Step 8: Create upload script for mounted volume
Write-Host "Creating upload script for mounted volume..." -ForegroundColor Yellow
$uploadScript = @"
# Copy this command after mounting volume:
# railway volume mount
# Then run:
Copy-Item "$sourceDir\*" -Destination "<mounted-volume-path>" -Recurse -Force
"@

$uploadScriptPath = Join-Path $PSScriptRoot "upload-to-volume.txt"
$uploadScript | Out-File -FilePath $uploadScriptPath -Encoding UTF8

Write-Host "✅ Created: $uploadScriptPath" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Yellow
Write-Host "  - Railway CLI: ✅ Ready" -ForegroundColor Green
Write-Host "  - Video files: ✅ Found ($videoCount files, $totalSizeGB GB)" -ForegroundColor Green
Write-Host "  - Next step: Create Volume in Railway Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tip: The easiest way is to use Railway Dashboard - Volumes - Upload Files" -ForegroundColor Cyan
Write-Host ""

