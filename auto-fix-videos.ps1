# Auto-detect and fix video URLs for production
Write-Host "Auto-fixing Video URLs for Production" -ForegroundColor Cyan
Write-Host ""

$backendUrl = $null

# Method 1: Check environment variable
if ($env:BACKEND_URL) {
    $backendUrl = $env:BACKEND_URL
    Write-Host "Found BACKEND_URL in environment: $backendUrl" -ForegroundColor Green
}

# Method 2: Check REACT_APP_API_URL and extract base URL
if (-not $backendUrl -and $env:REACT_APP_API_URL) {
    $apiUrl = $env:REACT_APP_API_URL
    if ($apiUrl -match "^(https?://[^/]+)") {
        $backendUrl = $matches[1]
        Write-Host "Extracted backend URL from REACT_APP_API_URL: $backendUrl" -ForegroundColor Green
    }
}

# Method 3: Try Railway CLI
if (-not $backendUrl) {
    $hasRailway = Get-Command railway -ErrorAction SilentlyContinue
    if ($hasRailway) {
        Write-Host "Checking Railway..." -ForegroundColor Yellow
        try {
            railway status 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $railwayInfo = railway status --json 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($railwayInfo -and $railwayInfo.service -and $railwayInfo.service.domain) {
                    $backendUrl = "https://$($railwayInfo.service.domain)"
                    Write-Host "Found Railway URL: $backendUrl" -ForegroundColor Green
                }
            }
        } catch {
            # Railway CLI not available or not logged in
        }
    }
}

# Method 4: Check common deployment platforms from git remote
if (-not $backendUrl) {
    Write-Host "Checking git remote..." -ForegroundColor Yellow
    try {
        $gitRemote = git remote get-url origin 2>&1
        if ($gitRemote -match "railway|render|heroku") {
            Write-Host "Detected deployment platform from git remote" -ForegroundColor Yellow
            Write-Host "Please set BACKEND_URL manually" -ForegroundColor Yellow
        }
    } catch {
        # Git not available
    }
}

# If still no URL found, show instructions
if (-not $backendUrl) {
    Write-Host ""
    Write-Host "Could not auto-detect backend URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please set it manually using one of these methods:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Method 1: Set environment variable" -ForegroundColor White
    Write-Host "  `$env:BACKEND_URL=`"https://your-backend.railway.app`"" -ForegroundColor Gray
    Write-Host "  node server/scripts/fix-video-urls-production.js" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Method 2: Use fix-videos script" -ForegroundColor White
    Write-Host "  .\fix-videos.ps1 -BackendUrl `"https://your-backend.railway.app`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Method 3: Edit fix-video-urls-production.js directly" -ForegroundColor White
    Write-Host "  Edit server/scripts/fix-video-urls-production.js" -ForegroundColor Gray
    Write-Host "  Set BACKEND_URL constant" -ForegroundColor Gray
    Write-Host "  node server/scripts/fix-video-urls-production.js" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Validate URL format
if (-not ($backendUrl -match "^https?://")) {
    Write-Host "WARNING: Adding https:// prefix..." -ForegroundColor Yellow
    $backendUrl = "https://$backendUrl"
}

Write-Host ""
Write-Host "Updating video URLs to: $backendUrl" -ForegroundColor Yellow
Write-Host ""

$env:BACKEND_URL = $backendUrl
node server/scripts/fix-video-urls-production.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Video URLs updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Make sure your backend server has video files in server/uploads/videos/" -ForegroundColor White
    Write-Host "  2. Test video playback in your app" -ForegroundColor White
    Write-Host "  3. If videos don't work, check backend logs" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update video URLs" -ForegroundColor Red
    exit 1
}

