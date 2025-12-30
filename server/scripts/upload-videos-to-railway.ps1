# PowerShell script to upload video files to Railway Volume
# Usage: .\upload-videos-to-railway.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎥 Upload Videos to Railway Volume" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

# Check if logged in
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please login:" -ForegroundColor Yellow
    Write-Host "  railway login" -ForegroundColor White
    exit 1
}
Write-Host "✅ Logged in to Railway" -ForegroundColor Green
Write-Host ""

# Check if project is linked
Write-Host "Checking project link..." -ForegroundColor Yellow
$projectCheck = railway status 2>&1
if ($LASTEXITCODE -ne 0 -or $projectCheck -match "No project linked") {
    Write-Host "⚠️  No project linked." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Linking project..." -ForegroundColor Yellow
    railway link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Source directory
$sourceDir = Join-Path $PSScriptRoot "..\uploads\videos"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}

# Count video files
$videoFiles = Get-ChildItem -Path $sourceDir -Include *.mp4,*.webm,*.mov -File
$videoCount = $videoFiles.Count

if ($videoCount -eq 0) {
    Write-Host "❌ No video files found in: $sourceDir" -ForegroundColor Red
    exit 1
}

Write-Host "📹 Found $videoCount video files" -ForegroundColor Green
Write-Host ""

# Calculate total size
$totalSize = ($videoFiles | Measure-Object -Property Length -Sum).Sum
$totalSizeGB = [math]::Round($totalSize / 1GB, 2)

Write-Host "📊 Total size: $totalSizeGB GB" -ForegroundColor Cyan
Write-Host ""

# List files
Write-Host "Files to upload:" -ForegroundColor Cyan
$fileList = @()
foreach ($file in $videoFiles) {
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "  - $($file.Name) ($sizeMB MB)" -ForegroundColor Gray
    $fileList += $file
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Railway Volume must be created first!" -ForegroundColor Yellow
Write-Host "   Go to Railway Dashboard → Volumes → Create Volume" -ForegroundColor Yellow
Write-Host "   Mount path: /app/server/uploads/videos" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue with upload? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Upload cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting upload process..." -ForegroundColor Cyan
Write-Host ""

# Method 1: Try using railway run
Write-Host "Method 1: Using railway run..." -ForegroundColor Yellow

# Create a script to run on Railway
$remoteScript = @"
#!/bin/bash
set -e

VOLUME_PATH="/app/server/uploads/videos"
echo "Creating directory: `$VOLUME_PATH"
mkdir -p `$VOLUME_PATH

echo "✅ Directory created"
echo "📁 Current files in volume:"
ls -lh `$VOLUME_PATH | head -10 || echo "Directory is empty"
"@

# Save script to temp file
$tempScript = Join-Path $env:TEMP "railway-check-volume.sh"
$remoteScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

Write-Host "Checking volume mount..." -ForegroundColor Gray
railway run bash -c "cat > /tmp/check-volume.sh << 'EOF'
$remoteScript
EOF
bash /tmp/check-volume.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Volume is accessible" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not verify volume. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📤 Uploading files..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Note: Railway CLI does not support direct file upload." -ForegroundColor Yellow
Write-Host "   Please use one of these methods:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Method A: Railway Dashboard (Easiest)" -ForegroundColor Cyan
Write-Host "   1. Go to Railway Dashboard → Volumes" -ForegroundColor White
Write-Host "   2. Click on your volume" -ForegroundColor White
Write-Host "   3. Click 'Upload Files' or 'Browse'" -ForegroundColor White
Write-Host "   4. Select all files from: $sourceDir" -ForegroundColor White
Write-Host ""
Write-Host "Method B: Railway Volume Mount (Advanced)" -ForegroundColor Cyan
Write-Host "   1. Run: railway volume mount" -ForegroundColor White
Write-Host "   2. Copy files to the mounted directory" -ForegroundColor White
Write-Host "   3. Example: Copy-Item '$sourceDir\*' -Destination '<mounted-path>' -Recurse" -ForegroundColor White
Write-Host ""

# Try to use volume mount if available
Write-Host "Attempting to use volume mount..." -ForegroundColor Yellow
Write-Host "Run this command in a new terminal:" -ForegroundColor Cyan
Write-Host "  railway volume mount" -ForegroundColor White
Write-Host ""
Write-Host "Then copy files using:" -ForegroundColor Cyan
Write-Host "  Copy-Item '$sourceDir\*' -Destination '<mounted-volume-path>' -Recurse" -ForegroundColor White
Write-Host ""

# Alternative: Create a batch upload script
$uploadScript = @"
# Railway Upload Script
# Run this after mounting volume with: railway volume mount

SOURCE_DIR="$sourceDir"
VOLUME_MOUNT="<your-mounted-volume-path>"

echo "Copying files..."
cp -r `$SOURCE_DIR/* `$VOLUME_MOUNT/

echo "Verifying..."
ls -lh `$VOLUME_MOUNT | head -20
echo ""
echo "✅ Upload complete!"
"@

$uploadScriptPath = Join-Path $PSScriptRoot "upload-to-mounted-volume.sh"
$uploadScript | Out-File -FilePath $uploadScriptPath -Encoding UTF8

Write-Host "📝 Created upload script: $uploadScriptPath" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create Railway Volume (if not done)" -ForegroundColor White
Write-Host "2. Upload files using Railway Dashboard or volume mount" -ForegroundColor White
Write-Host "3. Verify files: railway shell → ls -lh /app/server/uploads/videos/" -ForegroundColor White
Write-Host "4. Test video playback in the application" -ForegroundColor White
Write-Host ""

