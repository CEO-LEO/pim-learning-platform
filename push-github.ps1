# Push to GitHub Script

Write-Host "=== PIM Learning Platform - Push to GitHub ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: สร้าง GitHub repository" -ForegroundColor Yellow
Write-Host "1. ไปที่: https://github.com/new" -ForegroundColor Green
Write-Host "2. Repository name: pim-learning-platform" -ForegroundColor Green
Write-Host "3. อย่า check Initialize with README" -ForegroundColor Green
Write-Host "4. คลิก Create repository" -ForegroundColor Green
Write-Host ""
$repoUrl = Read-Host "Step 2: ใส่ GitHub repository URL (เช่น https://github.com/CEO-LEO/pim-learning-platform.git)"

if ($repoUrl) {
    Write-Host ""
    Write-Host "กำลังเพิ่ม remote..." -ForegroundColor Yellow
    
    # Check if remote exists
    $checkRemote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        git remote set-url origin $repoUrl
    } else {
        git remote add origin $repoUrl
    }
    
    Write-Host "กำลัง push code..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS! Code ถูก push แล้ว" -ForegroundColor Green
        Write-Host ""
        Write-Host "ขั้นตอนต่อไป:" -ForegroundColor Cyan
        Write-Host "1. ไปที่ Vercel: https://vercel.com/new" -ForegroundColor Yellow
        Write-Host "2. Refresh หน้า (F5)" -ForegroundColor Yellow
        Write-Host "3. ควรเห็น pim-learning-platform ในรายการ" -ForegroundColor Yellow
        Write-Host "4. คลิก Import" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "ERROR: Push ไม่สำเร็จ" -ForegroundColor Red
        Write-Host ""
        Write-Host "ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
        Write-Host "- Username: GitHub username ของคุณ" -ForegroundColor Yellow
        Write-Host "- Password: ใช้ Personal Access Token" -ForegroundColor Yellow
        Write-Host "- สร้าง Token: https://github.com/settings/tokens" -ForegroundColor Yellow
    }
} else {
    Write-Host "ยกเลิก" -ForegroundColor Red
}

