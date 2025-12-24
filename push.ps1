# Push to GitHub

Write-Host "=== PIM Learning Platform - Push to GitHub ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Create GitHub repository" -ForegroundColor Yellow
Write-Host "Go to: https://github.com/new" -ForegroundColor Green
Write-Host "Repository name: pim-learning-platform" -ForegroundColor Green
Write-Host "Do NOT check Initialize with README" -ForegroundColor Green
Write-Host "Click Create repository" -ForegroundColor Green
Write-Host ""
$repoUrl = Read-Host "Step 2: Enter GitHub repository URL (e.g. https://github.com/CEO-LEO/pim-learning-platform.git)"

if ($repoUrl) {
    Write-Host ""
    Write-Host "Adding remote..." -ForegroundColor Yellow
    
    $checkRemote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        git remote set-url origin $repoUrl
    } else {
        git remote add origin $repoUrl
    }
    
    Write-Host "Pushing code..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Code pushed to GitHub" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to Vercel: https://vercel.com/new" -ForegroundColor Yellow
        Write-Host "2. Refresh page (F5)" -ForegroundColor Yellow
        Write-Host "3. You should see pim-learning-platform in the list" -ForegroundColor Yellow
        Write-Host "4. Click Import" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERROR: Push failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "If GitHub asks for Username/Password:" -ForegroundColor Yellow
        Write-Host "- Username: Your GitHub username" -ForegroundColor Yellow
        Write-Host "- Password: Use Personal Access Token (not real password)" -ForegroundColor Yellow
        Write-Host "- Create Token: https://github.com/settings/tokens" -ForegroundColor Yellow
    }
} else {
    Write-Host "Cancelled" -ForegroundColor Red
}

