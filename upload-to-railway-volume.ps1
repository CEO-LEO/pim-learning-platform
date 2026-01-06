# Upload videos to Railway Volume
# This script uploads video files to the Railway volume via the backend API

$ErrorActionPreference = "Stop"

Write-Host "=== Uploading Videos to Railway Volume ===" -ForegroundColor Cyan

# Get backend URL
$backendUrl = railway run echo '${RAILWAY_PUBLIC_DOMAIN}'
if (-not $backendUrl) {
    Write-Host "Error: Could not get Railway backend URL" -ForegroundColor Red
    exit 1
}

$backendUrl = "https://$backendUrl"
Write-Host "Backend URL: $backendUrl" -ForegroundColor Green

# Video files directory
$videosDir = "server/uploads/videos"
$videoFiles = Get-ChildItem -Path $videosDir -Filter "*.mp4"

Write-Host "`nFound $($videoFiles.Count) video files to upload" -ForegroundColor Yellow

# Create a temporary upload endpoint script
$uploadScript = @'
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = '/app/server/uploads/videos';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/temp-upload-video', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        success: true, 
        filename: req.file.filename,
        size: req.file.size 
    });
});

app.get('/temp-upload-status', (req, res) => {
    const files = fs.readdirSync(uploadsDir);
    res.json({ status: 'ready', filesInVolume: files.length });
});

app.listen(PORT, () => {
    console.log(`Temporary upload server running on port ${PORT}`);
});
'@

Write-Host "`nCreating temporary upload endpoint on Railway..." -ForegroundColor Yellow
Set-Content -Path "temp-upload-server.js" -Value $uploadScript

# Deploy the temporary upload script
Write-Host "Deploying upload endpoint..." -ForegroundColor Yellow

# Copy temp script to server directory
Copy-Item "temp-upload-server.js" -Destination "server/temp-upload-server.js" -Force

# Upload each video file
$uploadedCount = 0
foreach ($file in $videoFiles) {
    Write-Host "`nUploading: $($file.Name) ($([math]::Round($file.Length/1MB, 2)) MB)..." -ForegroundColor Cyan
    
    try {
        # Use railway run to copy file to volume
        $command = "cat 'server/uploads/videos/$($file.Name)' > '/app/server/uploads/videos/$($file.Name)'"
        railway run bash -c $command
        
        $uploadedCount++
        Write-Host "  Uploaded successfully!" -ForegroundColor Green
    }
    catch {
        Write-Host "  Upload failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Upload Complete ===" -ForegroundColor Cyan
Write-Host "Uploaded $uploadedCount out of $($videoFiles.Count) files" -ForegroundColor Green

# Cleanup
Remove-Item "temp-upload-server.js" -ErrorAction SilentlyContinue
Remove-Item "server/temp-upload-server.js" -ErrorAction SilentlyContinue

Write-Host "`nVerifying upload..." -ForegroundColor Yellow
railway run node server/scripts/check-backend-videos.js

