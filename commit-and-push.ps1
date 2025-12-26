# Commit and Push All Changes to GitHub
Write-Host "🚀 Commit and Push All Changes" -ForegroundColor Cyan
Write-Host ""

# ตรวจสอบว่าเป็น git repository หรือไม่
if (-not (Test-Path .git)) {
    Write-Host "❌ ไม่ใช่ Git repository - กำลังสร้าง..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✓ สร้าง Git repository แล้ว" -ForegroundColor Green
}

Write-Host "📋 กำลังตรวจสอบไฟล์ที่เปลี่ยนแปลง..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host ""
    Write-Host "ไฟล์ที่เปลี่ยนแปลง:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
    
    Write-Host "📦 กำลังเพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
    git add -A
    
    Write-Host "💾 กำลัง commit..." -ForegroundColor Yellow
    $commitMessage = "Update: เพิ่มวิดีโอใหม่สำหรับทุก module, ปรับปรุง UI และแก้ไขข้อความ"
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Commit สำเร็จ" -ForegroundColor Green
        Write-Host ""
        
        # ตรวจสอบ remote
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
        Write-Host "📤 กำลัง push ขึ้น GitHub..." -ForegroundColor Yellow
        git branch -M main 2>&1 | Out-Null
        git push -u origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Push สำเร็จ!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 ขั้นตอนต่อไป:" -ForegroundColor Cyan
            Write-Host "1. ไปที่ Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
            Write-Host "2. หาโปรเจ็กต์ pim-learning-platform" -ForegroundColor Yellow
            Write-Host "3. คลิกที่โปรเจ็กต์ → Deployments → คลิก 3 dots → Redeploy" -ForegroundColor Yellow
            Write-Host "   หรือ Vercel จะ rebuild อัตโนมัติใน 1-2 นาที" -ForegroundColor Yellow
            Write-Host "4. รอให้ deployment เสร็จ (ประมาณ 2-3 นาที)" -ForegroundColor Yellow
            Write-Host "5. Refresh หน้าเว็บที่: https://pim-learning-platform.vercel.app" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "❌ Push ไม่สำเร็จ" -ForegroundColor Red
            Write-Host ""
            Write-Host "💡 ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
            Write-Host "   - Username: GitHub username ของคุณ" -ForegroundColor Yellow
            Write-Host "   - Password: ใช้ Personal Access Token (ไม่ใช่ password จริง)" -ForegroundColor Yellow
            Write-Host "   - สร้าง Token ได้ที่: https://github.com/settings/tokens" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "💡 หรือลอง push อีกครั้งด้วยคำสั่ง:" -ForegroundColor Yellow
            Write-Host "   git push -u origin main" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Commit ไม่สำเร็จ" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ️  ไม่มีไฟล์ที่เปลี่ยนแปลง" -ForegroundColor Gray
    Write-Host ""
    Write-Host "กำลังตรวจสอบว่า code ถูก push แล้วหรือยัง..." -ForegroundColor Yellow
    $remote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Remote: $remote" -ForegroundColor Green
        Write-Host ""
        Write-Host "กำลัง push (ถ้ายังไม่เคย push)..." -ForegroundColor Yellow
        git branch -M main 2>&1 | Out-Null
        git push -u origin main
    } else {
        Write-Host "⚠️  ยังไม่มี GitHub remote" -ForegroundColor Yellow
        Write-Host "กรุณารัน script นี้อีกครั้งเพื่อเพิ่ม remote" -ForegroundColor Yellow
    }
}

