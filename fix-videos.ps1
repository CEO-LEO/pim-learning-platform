# Simple script to fix video URLs for production
# Usage: .\fix-videos.ps1 -BackendUrl "https://your-backend.railway.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendUrl
)

Write-Host "Fix Video URLs for Production" -ForegroundColor Cyan
Write-Host ""

# Validate URL format
if (-not ($BackendUrl -match "^https?://")) {
    Write-Host "WARNING: Adding https:// prefix..." -ForegroundColor Yellow
    $BackendUrl = "https://$BackendUrl"
}

Write-Host "Updating video URLs to: $BackendUrl" -ForegroundColor Yellow
Write-Host ""

$env:BACKEND_URL = $BackendUrl
node server/scripts/fix-video-urls-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Video URLs updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Make sure your backend server has video files in server/uploads/videos/" -ForegroundColor White
    Write-Host "   2. Test video playback in your app" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update video URLs" -ForegroundColor Red
    exit 1
}
