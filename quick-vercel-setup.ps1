# Quick script to help setup Vercel environment variable

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vercel Environment Variable Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up REACT_APP_API_URL in Vercel" -ForegroundColor Yellow
Write-Host ""

Write-Host "Step 1: Find your backend URL" -ForegroundColor Cyan
Write-Host "  - Railway: https://railway.app/dashboard" -ForegroundColor Gray
Write-Host "  - Render: https://dashboard.render.com/" -ForegroundColor Gray
Write-Host "  - Heroku: https://dashboard.heroku.com/" -ForegroundColor Gray
Write-Host ""

$backendUrl = Read-Host "Enter your backend URL (e.g., https://your-app.railway.app)"

if ([string]::IsNullOrWhiteSpace($backendUrl)) {
    Write-Host "Backend URL is required!" -ForegroundColor Red
    exit 1
}

# Validate and format URL
if (-not ($backendUrl -match "^https?://")) {
    $backendUrl = "https://$backendUrl"
}

# Remove trailing slash
$backendUrl = $backendUrl.TrimEnd('/')

# Add /api if not present
if (-not $backendUrl.EndsWith('/api')) {
    $apiUrl = "$backendUrl/api"
} else {
    $apiUrl = $backendUrl
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Configuration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Environment Variable Name: REACT_APP_API_URL" -ForegroundColor White
Write-Host "Environment Variable Value: $apiUrl" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Select project: pim-learning-platform" -ForegroundColor Yellow
Write-Host "3. Go to: Settings -> Environment Variables" -ForegroundColor Yellow
Write-Host "4. Click: Add New" -ForegroundColor Yellow
Write-Host "5. Enter:" -ForegroundColor Yellow
Write-Host "   Name: REACT_APP_API_URL" -ForegroundColor White
Write-Host "   Value: $apiUrl" -ForegroundColor White
Write-Host "   Environment: Select all (Production, Preview, Development)" -ForegroundColor White
Write-Host "6. Click: Save" -ForegroundColor Yellow
Write-Host "7. Redeploy your project" -ForegroundColor Yellow
Write-Host ""
Write-Host "After redeploy, videos should work!" -ForegroundColor Green
Write-Host ""

