# Script สำหรับ Push Code ขึ้น GitHub

Write-Host "🚀 PIM Learning Platform - Push to GitHub" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่าเป็น git repository หรือไม่
if (-not (Test-Path .git)) {
    Write-Host "❌ ไม่ใช่ Git repository" -ForegroundColor Red
    exit 1
}

# ตรวจสอบว่า remote มีหรือไม่
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  ยังไม่มี GitHub remote" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "กรุณาสร้าง GitHub repository ก่อน:" -ForegroundColor Yellow
    Write-Host "1. ไปที่: https://github.com/new" -ForegroundColor Green
    Write-Host "2. สร้าง repository (ชื่ออะไรก็ได้ เช่น pim-learning-platform)" -ForegroundColor Green
    Write-Host "3. คัดลอก URL ที่ GitHub ให้" -ForegroundColor Green
    Write-Host ""
    $repoUrl = Read-Host "ใส่ GitHub repository URL (เช่น https://github.com/username/repo.git)"
    
    if ($repoUrl) {
        Write-Host ""
        Write-Host "กำลังเพิ่ม remote..." -ForegroundColor Yellow
        git remote add origin $repoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ เพิ่ม remote สำเร็จ" -ForegroundColor Green
        } else {
            Write-Host "❌ ไม่สามารถเพิ่ม remote ได้" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ ไม่มี URL" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
}

Write-Host ""
Write-Host "กำลัง push code ขึ้น GitHub..." -ForegroundColor Yellow

# เปลี่ยน branch เป็น main
git branch -M main 2>&1 | Out-Null

# Push
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push สำเร็จ!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 ขั้นตอนต่อไป:" -ForegroundColor Cyan
    Write-Host "1. ไปที่ Vercel: https://vercel.com/new" -ForegroundColor Yellow
    Write-Host "2. Refresh หน้า (F5)" -ForegroundColor Yellow
    Write-Host "3. ควรเห็น repository ในรายการ" -ForegroundColor Yellow
    Write-Host "4. คลิก Import" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Push ไม่สำเร็จ" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
    Write-Host "   - Username: GitHub username ของคุณ" -ForegroundColor Yellow
    Write-Host "   - Password: ใช้ Personal Access Token (ไม่ใช่ password จริง)" -ForegroundColor Yellow
    Write-Host "   - สร้าง Token ได้ที่: https://github.com/settings/tokens" -ForegroundColor Yellow
}

