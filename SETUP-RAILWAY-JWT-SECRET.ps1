# PowerShell script to set JWT_SECRET in Railway
# This script requires Railway CLI to be installed

Write-Host "🔐 Setting JWT_SECRET in Railway..." -ForegroundColor Cyan

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI is not installed!" -ForegroundColor Red
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
}

# Generate JWT_SECRET
Write-Host "🔑 Generating JWT_SECRET..." -ForegroundColor Cyan
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" | Out-String
$jwtSecret = $jwtSecret.Trim()
Write-Host "Generated JWT_SECRET: $jwtSecret" -ForegroundColor Green

# Set JWT_SECRET in Railway
Write-Host "📝 Setting JWT_SECRET in Railway..." -ForegroundColor Cyan
railway variables set JWT_SECRET="$jwtSecret"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ JWT_SECRET has been set successfully!" -ForegroundColor Green
    Write-Host "🔄 Railway will auto-redeploy the service..." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to set JWT_SECRET" -ForegroundColor Red
    Write-Host "Please set it manually in Railway dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to https://railway.app" -ForegroundColor Yellow
    Write-Host "2. Select your project and service" -ForegroundColor Yellow
    Write-Host "3. Go to Variables tab" -ForegroundColor Yellow
    Write-Host "4. Add new variable: JWT_SECRET = $jwtSecret" -ForegroundColor Yellow
    exit 1
}

