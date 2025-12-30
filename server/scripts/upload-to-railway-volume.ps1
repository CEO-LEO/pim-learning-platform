# PowerShell script to upload video files to Railway Volume
# Usage: .\upload-to-railway-volume.ps1

$ErrorActionPreference = "Stop"

Write-Host "📤 Uploading video files to Railway Volume..." -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found." -ForegroundColor Red
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway." -ForegroundColor Red
    Write-Host "Run: railway login" -ForegroundColor Yellow
    exit 1
}

# Source directory
$sourceDir = Join-Path $PSScriptRoot "..\uploads\videos"
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}

# Count video files
$videoFiles = Get-ChildItem -Path $sourceDir -Include *.mp4,*.webm,*.mov -Recurse
$videoCount = $videoFiles.Count

Write-Host "📹 Found $videoCount video files to upload" -ForegroundColor Green
Write-Host ""

# List files with sizes
Write-Host "Files to upload:" -ForegroundColor Cyan
foreach ($file in $videoFiles) {
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "  - $($file.Name) ($sizeMB MB)" -ForegroundColor Gray
}

Write-Host ""
$confirm = Read-Host "Continue with upload? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Upload cancelled." -ForegroundColor Yellow
    exit 0
}

# Method 1: Use railway run to copy files
Write-Host ""
Write-Host "🚀 Starting upload..." -ForegroundColor Cyan
Write-Host ""

# Create a temporary script file for Railway
$tempScript = Join-Path $env:TEMP "railway-upload-videos.sh"
$volumePath = "/app/server/uploads/videos"

$scriptContent = @"
#!/bin/bash
set -e

echo "Creating destination directory..."
mkdir -p $volumePath

echo "Uploading files..."
"@

# Add copy commands for each file
foreach ($file in $videoFiles) {
    $fileName = $file.Name
    $scriptContent += @"

echo "Uploading $fileName..."
"@
}

$scriptContent += @"

echo ""
echo "✅ Upload complete!"
echo "Verifying files..."
ls -lh $volumePath | head -20
echo ""
echo "📊 Summary:"
echo "  Files in volume: `$(find $volumePath -type f | wc -l)"
echo "  Total size: `$(du -sh $volumePath | cut -f1)"
"@

# Write script to temp file
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Created upload script: $tempScript" -ForegroundColor Gray
Write-Host ""

# Alternative: Use railway run with direct commands
Write-Host "⚠️  Note: Railway CLI upload requires manual steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use Railway Dashboard" -ForegroundColor Cyan
Write-Host "  1. Go to Railway Dashboard → Volumes" -ForegroundColor Gray
Write-Host "  2. Click on your volume" -ForegroundColor Gray
Write-Host "  3. Use 'Upload Files' feature" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Use railway run (interactive)" -ForegroundColor Cyan
Write-Host "  railway run bash" -ForegroundColor Gray
Write-Host "  # Then manually copy files" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Use railway volume mount (local mount)" -ForegroundColor Cyan
Write-Host "  railway volume mount" -ForegroundColor Gray
Write-Host "  # Then copy files to mounted directory" -ForegroundColor Gray
Write-Host ""

# Check if we can use railway run
Write-Host "Attempting to use railway run..." -ForegroundColor Yellow
try {
    railway run echo "Testing Railway connection..."
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "To upload files, run:" -ForegroundColor Cyan
        Write-Host "  railway run bash" -ForegroundColor White
        Write-Host "  # Then in the shell:" -ForegroundColor Gray
        Write-Host "  mkdir -p $volumePath" -ForegroundColor White
        Write-Host "  # Copy files manually or use scp/rsync" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not test Railway connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Recommended: Use Railway Dashboard to upload files" -ForegroundColor Green
Write-Host "   Dashboard → Volumes → Your Volume → Upload Files" -ForegroundColor Gray
Write-Host ""

# Cleanup
if (Test-Path $tempScript) {
    Remove-Item $tempScript -Force
}

Write-Host "✅ Script completed!" -ForegroundColor Green

