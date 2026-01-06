# PowerShell script to setup production video URLs
# This script helps you find and set the backend URL for production

Write-Host "🚀 Setup Production Video URLs" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue

if ($hasRailway) {
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
    Write-Host ""
    
    # Try to get Railway project info
    Write-Host "🔍 Checking Railway project..." -ForegroundColor Yellow
    railway status 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway project found" -ForegroundColor Green
        Write-Host ""
        
        # Try to get Railway URL
        Write-Host "🔍 Getting Railway URL..." -ForegroundColor Yellow
        $railwayUrlOutput = railway variables get RAILWAY_PUBLIC_DOMAIN 2>&1
        $railwayUrl = $railwayUrlOutput | Select-Object -First 1
        
        if ($railwayUrl -and ($railwayUrl -notmatch "error") -and ($railwayUrl -notmatch "not found")) {
            $backendUrl = "https://$railwayUrl"
            Write-Host "✅ Found Railway URL: $backendUrl" -ForegroundColor Green
            Write-Host ""
            
            Write-Host "📝 Updating video URLs..." -ForegroundColor Yellow
            $env:BACKEND_URL = $backendUrl
            node server/scripts/fix-video-urls-production.js
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Done! Video URLs updated to use: $backendUrl" -ForegroundColor Green
                exit 0
            }
        }
    }
}

# If Railway CLI not found or can't get URL, ask user
Write-Host "⚠️  Could not automatically detect backend URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please enter your backend URL:" -ForegroundColor Cyan
Write-Host "  Examples:" -ForegroundColor Gray
Write-Host "    - Railway: https://your-app.railway.app" -ForegroundColor Gray
Write-Host "    - Render: https://your-app.onrender.com" -ForegroundColor Gray
Write-Host "    - Heroku: https://your-app.herokuapp.com" -ForegroundColor Gray
Write-Host ""

$backendUrl = Read-Host "Backend URL"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host "❌ Backend URL is required!" -ForegroundColor Red
    exit 1
}

# Validate URL format
if (-not ($backendUrl -match "^https?://")) {
    Write-Host "⚠️  URL should start with http:// or https://" -ForegroundColor Yellow
    Write-Host "   Adding https:// prefix..." -ForegroundColor Yellow
    $backendUrl = "https://$backendUrl"
}

Write-Host ""
Write-Host "📝 Updating video URLs to: $backendUrl" -ForegroundColor Yellow
Write-Host ""

$env:BACKEND_URL = $backendUrl
node server/scripts/fix-video-urls-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Done! Video URLs updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Make sure your backend server has video files in server/uploads/videos/" -ForegroundColor White
    Write-Host "   2. Test video playback in your app" -ForegroundColor White
    Write-Host "   3. If videos don't work, check backend logs" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to update video URLs" -ForegroundColor Red
    exit 1
}
