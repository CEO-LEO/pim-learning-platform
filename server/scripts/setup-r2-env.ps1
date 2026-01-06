# PowerShell script to set up R2 environment variables
# Usage: .\server\scripts\setup-r2-env.ps1

Write-Host "🔧 Cloudflare R2 Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot "..\..\.env"
$serverEnvPath = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $serverEnvPath) {
    $envPath = $serverEnvPath
}

if (-not (Test-Path $envPath)) {
    Write-Host "⚠️  .env file not found. Creating new one..." -ForegroundColor Yellow
    New-Item -Path $envPath -ItemType File -Force | Out-Null
}

Write-Host "📝 Please enter your Cloudflare R2 credentials:" -ForegroundColor Yellow
Write-Host ""

$accountId = Read-Host "R2 Account ID"
$accessKeyId = Read-Host "R2 Access Key ID"
$secretAccessKey = Read-Host "R2 Secret Access Key" -AsSecureString
$bucketName = Read-Host "R2 Bucket Name (default: pim-videos)"
$publicUrl = Read-Host "R2 Public URL (optional, will be auto-generated if empty)"

# Convert secure string to plain text
$secretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretAccessKey))

if ([string]::IsNullOrWhiteSpace($bucketName)) {
    $bucketName = "pim-videos"
}

if ([string]::IsNullOrWhiteSpace($publicUrl)) {
    $publicUrl = "https://$accountId.r2.cloudflarestorage.com/$bucketName"
}

# Read existing .env file
$envContent = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
}

# Remove existing R2 variables
$envContent = $envContent -replace "R2_ACCOUNT_ID=.*", ""
$envContent = $envContent -replace "R2_ACCESS_KEY_ID=.*", ""
$envContent = $envContent -replace "R2_SECRET_ACCESS_KEY=.*", ""
$envContent = $envContent -replace "R2_BUCKET_NAME=.*", ""
$envContent = $envContent -replace "R2_PUBLIC_URL=.*", ""

# Add new R2 variables
$r2Config = @"

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=$accountId
R2_ACCESS_KEY_ID=$accessKeyId
R2_SECRET_ACCESS_KEY=$secretAccessKeyPlain
R2_BUCKET_NAME=$bucketName
R2_PUBLIC_URL=$publicUrl
"@

# Append to .env file
Add-Content -Path $envPath -Value $r2Config

Write-Host ""
Write-Host "✅ R2 configuration saved to .env file!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Account ID: $accountId"
Write-Host "   Bucket: $bucketName"
Write-Host "   Public URL: $publicUrl"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Install dependencies: npm install @aws-sdk/client-s3"
Write-Host "   2. Upload videos: node server/scripts/upload-videos-to-r2.js"
Write-Host "   3. Update database: node server/scripts/update-video-urls-to-r2.js"
Write-Host ""

