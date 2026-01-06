# Script to fix all video issues - Complete solution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix All Video Issues - Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you fix video issues completely" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking current status..." -ForegroundColor Cyan
node server/scripts/check-backend-videos.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Choose Solution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Upload to Railway Volume" -ForegroundColor Yellow
Write-Host "  - Use existing video files" -ForegroundColor Gray
Write-Host "  - Requires Railway Volume setup" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Use Cloudflare R2 (Recommended)" -ForegroundColor Yellow
Write-Host "  - Free 10GB storage" -ForegroundColor Gray
Write-Host "  - No bandwidth costs" -ForegroundColor Gray
Write-Host "  - Easier to setup" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choose option (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Setting up Railway Volume upload..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to Railway Dashboard -> Volumes" -ForegroundColor White
    Write-Host "  2. Create Volume with mount path: /app/server/uploads/videos" -ForegroundColor White
    Write-Host "  3. Run: .\upload-videos-to-railway.ps1" -ForegroundColor White
    Write-Host ""
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Setting up Cloudflare R2..." -ForegroundColor Cyan
    Write-Host ""
    
    # Check if R2 credentials are set
    if (-not $env:R2_ACCOUNT_ID) {
        Write-Host "R2 credentials not set. Please run:" -ForegroundColor Yellow
        Write-Host "  .\server\scripts\setup-r2-env.ps1" -ForegroundColor White
        Write-Host ""
        Write-Host "Or set manually:" -ForegroundColor Yellow
        Write-Host "  `$env:R2_ACCOUNT_ID=`"your-account-id`"" -ForegroundColor White
        Write-Host "  `$env:R2_ACCESS_KEY_ID=`"your-access-key`"" -ForegroundColor White
        Write-Host "  `$env:R2_SECRET_ACCESS_KEY=`"your-secret-key`"" -ForegroundColor White
        Write-Host "  `$env:R2_BUCKET_NAME=`"pim-videos`"" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "R2 credentials found. Proceeding..." -ForegroundColor Green
        Write-Host ""
        
        # Install dependencies
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        cd server
        npm install @aws-sdk/client-s3
        cd ..
        
        # Upload videos
        Write-Host ""
        Write-Host "Uploading videos to R2..." -ForegroundColor Yellow
        node server/scripts/upload-videos-to-r2.js
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Updating database URLs..." -ForegroundColor Yellow
            node server/scripts/update-video-urls-to-r2.js
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "  SUCCESS!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "Videos uploaded and URLs updated!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "  1. Set CORS in Cloudflare R2 Dashboard" -ForegroundColor White
                Write-Host "  2. Test video playback" -ForegroundColor White
                Write-Host ""
            }
        }
    }
} else {
    Write-Host "Invalid choice. Please run again and choose 1 or 2" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "For detailed instructions, see: FIX_ALL_VIDEOS.md" -ForegroundColor Cyan
Write-Host ""

