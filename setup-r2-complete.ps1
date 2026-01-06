# Complete Cloudflare R2 setup script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cloudflare R2 Setup - Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will set up Cloudflare R2 for video storage" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check if credentials are set
$hasR2 = $env:R2_ACCOUNT_ID -and $env:R2_ACCESS_KEY_ID -and $env:R2_SECRET_ACCESS_KEY

if (-not $hasR2) {
    Write-Host "Step 1: Setting up R2 credentials..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please create R2 bucket first:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://dash.cloudflare.com/" -ForegroundColor White
    Write-Host "  2. R2 -> Create bucket -> Name: pim-videos" -ForegroundColor White
    Write-Host "  3. Manage R2 API Tokens -> Create token" -ForegroundColor White
    Write-Host "  4. Copy: Account ID, Access Key ID, Secret Access Key" -ForegroundColor White
    Write-Host ""
    
    $accountId = Read-Host "R2 Account ID"
    $accessKey = Read-Host "R2 Access Key ID"
    $secretKey = Read-Host "R2 Secret Access Key" -AsSecureString
    $bucketName = Read-Host "R2 Bucket Name (default: pim-videos)"
    
    if ([string]::IsNullOrWhiteSpace($bucketName)) {
        $bucketName = "pim-videos"
    }
    
    # Convert secure string to plain text
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
    $secretKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    $env:R2_ACCOUNT_ID = $accountId
    $env:R2_ACCESS_KEY_ID = $accessKey
    $env:R2_SECRET_ACCESS_KEY = $secretKeyPlain
    $env:R2_BUCKET_NAME = $bucketName
    $env:R2_PUBLIC_URL = "https://$accountId.r2.cloudflarestorage.com/$bucketName"
    
    Write-Host ""
    Write-Host "Credentials set!" -ForegroundColor Green
} else {
    Write-Host "R2 credentials already set" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Cyan
cd server
npm install @aws-sdk/client-s3
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
cd ..

Write-Host ""
Write-Host "Step 3: Uploading videos to R2..." -ForegroundColor Cyan
node server/scripts/upload-videos-to-r2.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Step 4: Updating database URLs..." -ForegroundColor Cyan
    node server/scripts/update-video-urls-to-r2.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Videos uploaded and URLs updated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Final step: Set CORS in Cloudflare R2" -ForegroundColor Yellow
        Write-Host "  1. Go to R2 Dashboard -> Bucket -> Settings -> CORS" -ForegroundColor White
        Write-Host "  2. Add CORS rule:" -ForegroundColor White
        Write-Host "     Allowed Origins: *" -ForegroundColor Gray
        Write-Host "     Allowed Methods: GET, HEAD" -ForegroundColor Gray
        Write-Host "     Allowed Headers: *" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After setting CORS, videos will work!" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Upload failed. Please check errors above" -ForegroundColor Red
    exit 1
}

