# Complete Railway Volume setup for videos
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Railway Volume Setup - Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will help you upload videos to Railway Volume" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check Railway CLI
Write-Host "Step 1: Checking Railway CLI..." -ForegroundColor Cyan
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue

if (-not $hasRailway) {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "Railway CLI found" -ForegroundColor Green
}

# Step 2: Check login
Write-Host ""
Write-Host "Step 2: Checking Railway login..." -ForegroundColor Cyan
railway whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Railway:" -ForegroundColor Red
    Write-Host "  railway login" -ForegroundColor White
    exit 1
}
Write-Host "Logged in to Railway" -ForegroundColor Green

# Step 3: Check project
Write-Host ""
Write-Host "Step 3: Checking Railway project..." -ForegroundColor Cyan
railway status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please link Railway project:" -ForegroundColor Red
    Write-Host "  railway link" -ForegroundColor White
    exit 1
}
Write-Host "Project linked" -ForegroundColor Green

# Step 4: Create Volume instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  IMPORTANT: Create Railway Volume" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please create Railway Volume first:" -ForegroundColor White
Write-Host "  1. Go to: https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "  2. Select your project: pim-learning-platform" -ForegroundColor Gray
Write-Host "  3. Go to: Volumes" -ForegroundColor Gray
Write-Host "  4. Click: New Volume" -ForegroundColor Gray
Write-Host "  5. Name: video-files" -ForegroundColor Gray
Write-Host "  6. Mount path: /app/server/uploads/videos" -ForegroundColor Gray
Write-Host "  7. Create Volume" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Volume created? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host ""
    Write-Host "Please create the volume first, then run this script again" -ForegroundColor Yellow
    exit 0
}

# Step 5: Mount volume
Write-Host ""
Write-Host "Step 4: Mounting Railway volume..." -ForegroundColor Cyan
Write-Host "This will show the mount path (e.g., /tmp/railway-volume-xxxxx)" -ForegroundColor Gray
Write-Host ""

$mountOutput = railway volume mount 2>&1
Write-Host $mountOutput

# Extract mount path from output
$mountPath = $null
if ($mountOutput -match '(/tmp/railway-volume-[^\s]+|/mnt/[^\s]+)') {
    $mountPath = $matches[1]
    Write-Host ""
    Write-Host "Found mount path: $mountPath" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Could not auto-detect mount path" -ForegroundColor Yellow
    $mountPath = Read-Host "Please enter the mount path shown above"
}

if ([string]::IsNullOrWhiteSpace($mountPath)) {
    Write-Host "Mount path is required" -ForegroundColor Red
    exit 1
}

# Step 6: Copy files
Write-Host ""
Write-Host "Step 5: Copying video files..." -ForegroundColor Cyan

$videosDir = "server/uploads/videos"
if (-not (Test-Path $videosDir)) {
    Write-Host "Videos directory not found: $videosDir" -ForegroundColor Red
    exit 1
}

$videoFiles = Get-ChildItem -Path $videosDir -Filter "*.mp4"
if ($videoFiles.Count -eq 0) {
    Write-Host "No video files found in $videosDir" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($videoFiles.Count) video files" -ForegroundColor Green
Write-Host ""

# Check if running on Windows (need different copy method)
if ($IsWindows -or $env:OS -like "*Windows*") {
    Write-Host "Windows detected. Using Railway CLI to copy files..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Method 1: Use Railway Dashboard File Manager" -ForegroundColor Cyan
    Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
    Write-Host "  2. Click on your volume" -ForegroundColor White
    Write-Host "  3. Use File Manager to upload files" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 2: Use railway run (interactive)" -ForegroundColor Cyan
    Write-Host "  railway run bash" -ForegroundColor White
    Write-Host "  Then copy files manually" -ForegroundColor White
    Write-Host ""
    Write-Host "Method 3: Use WSL or Git Bash" -ForegroundColor Cyan
    Write-Host "  If you have WSL or Git Bash, you can use:" -ForegroundColor White
    Write-Host "  cp server/uploads/videos/*.mp4 $mountPath/" -ForegroundColor White
} else {
    # Linux/Mac - can copy directly
    Write-Host "Copying files to $mountPath..." -ForegroundColor Yellow
    Copy-Item -Path "$videosDir/*.mp4" -Destination $mountPath -Force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Files copied successfully!" -ForegroundColor Green
    } else {
        Write-Host "Copy failed. Please copy manually:" -ForegroundColor Red
        Write-Host "  cp $videosDir/*.mp4 $mountPath/" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Next Steps" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Verify files in Railway Dashboard -> Volumes" -ForegroundColor White
Write-Host "2. Restart your Railway service (if needed)" -ForegroundColor White
Write-Host "3. Test video playback" -ForegroundColor White
Write-Host ""
Write-Host "After files are uploaded, videos will work!" -ForegroundColor Green
Write-Host ""

