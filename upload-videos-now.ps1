# Upload Videos to Railway Volume
$ErrorActionPreference = "Stop"

Write-Host "=== Uploading Videos to Railway Volume ===" -ForegroundColor Cyan
Write-Host ""

# Check if railway is linked
Write-Host "Checking Railway project status..." -ForegroundColor Yellow
$projectInfo = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not linked to Railway project" -ForegroundColor Red
    exit 1
}

Write-Host "Railway project linked successfully" -ForegroundColor Green

# Get Railway backend URL - use direct approach
Write-Host "`nGetting Railway backend URL..." -ForegroundColor Yellow
$backendUrl = "https://pim-learning-platform-production.up.railway.app"
Write-Host "Backend URL: $backendUrl" -ForegroundColor Green

# Video files
$videosDir = "server/uploads/videos"
if (-not (Test-Path $videosDir)) {
    Write-Host "Error: Videos directory not found: $videosDir" -ForegroundColor Red
    exit 1
}

$videoFiles = Get-ChildItem -Path $videosDir -Filter "*.mp4"
Write-Host "`nFound $($videoFiles.Count) video files:" -ForegroundColor Cyan
foreach ($file in $videoFiles) {
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "  - $($file.Name) ($sizeMB MB)" -ForegroundColor Gray
}

# Check if upload endpoint is ready
Write-Host "`nChecking upload endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/temp-upload/status" -Method Get -TimeoutSec 10
    $status = $response.Content | ConvertFrom-Json
    Write-Host "Upload endpoint is ready" -ForegroundColor Green
    Write-Host "  Current files in volume: $($status.filesInVolume)" -ForegroundColor Gray
} catch {
    Write-Host "Warning: Upload endpoint not accessible yet" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host "`nWaiting 30 more seconds for deployment..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Try again
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/api/temp-upload/status" -Method Get -TimeoutSec 10
        Write-Host "Upload endpoint is now ready" -ForegroundColor Green
    } catch {
        Write-Host "Error: Upload endpoint still not accessible" -ForegroundColor Red
        Write-Host "Please wait a few more minutes and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Upload each video file
Write-Host "`n=== Uploading Video Files ===" -ForegroundColor Cyan
$uploadedCount = 0
$totalSize = 0

foreach ($file in $videoFiles) {
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    $fileName = $file.Name
    Write-Host "`nUploading: $fileName (${sizeMB} MB)..." -ForegroundColor Cyan
    
    try {
        # Use Invoke-WebRequest with multipart form
        $formData = @{
            video = Get-Item -Path $file.FullName
        }
        
        $response = Invoke-WebRequest -Uri "$backendUrl/api/temp-upload/upload" `
            -Method Post `
            -Form $formData `
            -TimeoutSec 300 `
            -ContentType "multipart/form-data"
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success) {
            $uploadedCount++
            $totalSize += $file.Length
            Write-Host "  Upload successful!" -ForegroundColor Green
            Write-Host "    Server confirmed: $($result.filename) ($($result.sizeInMB) MB)" -ForegroundColor Gray
        } else {
            Write-Host "  Upload failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "  Upload error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Small delay between uploads
    Start-Sleep -Seconds 2
}

# Summary
Write-Host "`n=== Upload Summary ===" -ForegroundColor Cyan
if ($uploadedCount -eq $videoFiles.Count) {
    Write-Host "Uploaded: $uploadedCount / $($videoFiles.Count) files" -ForegroundColor Green
} else {
    Write-Host "Uploaded: $uploadedCount / $($videoFiles.Count) files" -ForegroundColor Yellow
}
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "Total size: $totalSizeMB MB" -ForegroundColor Gray

# Verify upload
Write-Host "`n=== Verifying Upload ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/temp-upload/status" -Method Get
    $status = $response.Content | ConvertFrom-Json
    Write-Host "Files in Railway Volume: $($status.filesInVolume)" -ForegroundColor Green
    
    if ($status.files) {
        Write-Host "`nFiles on server:" -ForegroundColor Gray
        foreach ($f in $status.files) {
            Write-Host "  - $($f.name) ($($f.sizeInMB) MB)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Warning: Could not verify upload: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`nUpload process complete!" -ForegroundColor Green
Write-Host "`nNext step: Test videos on website: https://pim-learning-platform.vercel.app" -ForegroundColor Cyan
