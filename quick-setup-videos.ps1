# Quick setup script for video URLs
# This script provides an interactive way to set up production video URLs

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Video URLs Setup for Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current status
Write-Host "Checking current video URLs..." -ForegroundColor Yellow
node server/scripts/check-video-urls.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask user for backend URL
Write-Host "Enter your production backend URL:" -ForegroundColor Yellow
Write-Host "  Examples:" -ForegroundColor Gray
Write-Host "    - Railway: https://your-app.railway.app" -ForegroundColor Gray
Write-Host "    - Render: https://your-app.onrender.com" -ForegroundColor Gray
Write-Host "    - Heroku: https://your-app.herokuapp.com" -ForegroundColor Gray
Write-Host ""

$backendUrl = Read-Host "Backend URL (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host ""
    Write-Host "Skipped. You can set it later using:" -ForegroundColor Yellow
    Write-Host "  .\fix-videos.ps1 -BackendUrl `"https://your-backend.railway.app`"" -ForegroundColor White
    Write-Host ""
    exit 0
}

# Validate URL format
if (-not ($backendUrl -match "^https?://")) {
    Write-Host "Adding https:// prefix..." -ForegroundColor Yellow
    $backendUrl = "https://$backendUrl"
}

Write-Host ""
Write-Host "Updating video URLs to: $backendUrl" -ForegroundColor Yellow
Write-Host ""

$env:BACKEND_URL = $backendUrl
node server/scripts/fix-video-urls-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Video URLs updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Make sure your backend server has video files in server/uploads/videos/" -ForegroundColor White
    Write-Host "  2. Test video playback in your app" -ForegroundColor White
    Write-Host "  3. Verify URLs: node server/scripts/check-video-urls.js" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update video URLs" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Red
    Write-Host ""
    exit 1
}

