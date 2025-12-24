# Auto Push to GitHub Script

Write-Host "🚀 PIM Learning Platform - Auto Push to GitHub" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✓ GitHub CLI (gh) พบแล้ว" -ForegroundColor Green
    Write-Host ""
    Write-Host "กำลังสร้าง GitHub repository..." -ForegroundColor Yellow
    
    # Create repository using gh CLI
    gh repo create pim-learning-platform --public --source=. --remote=origin --push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ สำเร็จ! Repository ถูกสร้างและ push แล้ว" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 ขั้นตอนต่อไป:" -ForegroundColor Cyan
        Write-Host "1. ไปที่ Vercel: https://vercel.com/new" -ForegroundColor Yellow
        Write-Host "2. Refresh หน้า (F5)" -ForegroundColor Yellow
        Write-Host "3. ควรเห็น 'pim-learning-platform' ในรายการ" -ForegroundColor Yellow
        Write-Host "4. คลิก Import" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "❌ ไม่สามารถสร้าง repository ได้" -ForegroundColor Red
        Write-Host "กรุณาทำตามวิธี Manual ด้านล่าง" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  GitHub CLI (gh) ไม่พบ" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 วิธีที่ 1: ติดตั้ง GitHub CLI (แนะนำ)" -ForegroundColor Cyan
    Write-Host "1. ดาวน์โหลด: https://cli.github.com/" -ForegroundColor Green
    Write-Host "2. ติดตั้ง" -ForegroundColor Green
    Write-Host "3. Login: gh auth login" -ForegroundColor Green
    Write-Host "4. รัน script นี้อีกครั้ง" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 วิธีที่ 2: ทำเอง (Manual)" -ForegroundColor Cyan
    Write-Host "1. ไปที่: https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Repository name: pim-learning-platform" -ForegroundColor Yellow
    Write-Host "3. อย่า check 'Initialize with README'" -ForegroundColor Yellow
    Write-Host "4. คลิก Create repository" -ForegroundColor Yellow
    Write-Host "5. คัดลอก URL" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "ใส่ GitHub repository URL (เช่น https://github.com/username/repo.git)"
    
    if ($repoUrl) {
        Write-Host ""
        Write-Host "กำลังเพิ่ม remote และ push..." -ForegroundColor Yellow
        
        # Check if remote already exists
        $existingRemote = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "⚠️  Remote 'origin' มีอยู่แล้ว: $existingRemote" -ForegroundColor Yellow
            $overwrite = Read-Host "ต้องการเปลี่ยนเป็น URL ใหม่? (y/n)"
            if ($overwrite -eq 'y') {
                git remote set-url origin $repoUrl
            } else {
                Write-Host "ยกเลิก" -ForegroundColor Red
                exit
            }
        } else {
            git remote add origin $repoUrl
        }
        
        Write-Host "กำลัง push..." -ForegroundColor Yellow
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
            Write-Host "   - Password: ใช้ Personal Access Token" -ForegroundColor Yellow
            Write-Host "   - สร้าง Token: https://github.com/settings/tokens" -ForegroundColor Yellow
        }
    }
}

