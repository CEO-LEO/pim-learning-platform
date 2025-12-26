# Push All Code to GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PUSH CODE ทั้งหมด ขึ้น GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git repository exists
if (-not (Test-Path .git)) {
    Write-Host "❌ ไม่ใช่ Git repository" -ForegroundColor Red
    Write-Host "กำลังสร้าง Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✓ สร้าง Git repository แล้ว" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Show current status
Write-Host "[1/5] ตรวจสอบสถานะ..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "ไฟล์ที่เปลี่ยนแปลง:" -ForegroundColor Gray
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "ℹ️  ไม่มีไฟล์ที่เปลี่ยนแปลง" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Add all files
Write-Host "[2/5] เพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "✗ ล้มเหลว" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Commit
Write-Host "[3/5] Commit..." -ForegroundColor Yellow
$commitMsg = @"
Update: แก้ไข deprecation warning, ปรับปรุง UI, เพิ่มวิดีโอ และแก้ไขข้อความทั้งหมด

- แก้ไข deprecation warning fs.F_OK
- ปรับปรุง UI ให้มีขนาดเหมาะสม
- แก้ไขข้อความ "เริ่มต้นทำธุรกิจ" → "หลักสูตรทั้งหมด"
- แก้ไขข้อความ "เข้าสู่บทเรียน" → "เริ่มต้นบทเรียน"
- แก้ไขสถิติเวลาเรียน (นาที/ชั่วโมง)
- เพิ่ม autoplay สำหรับวิดีโอ
- เพิ่มวิดีโอสำหรับทุก module
"@
git commit -m $commitMsg
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit สำเร็จ" -ForegroundColor Green
    Write-Host ""
    Write-Host "Commit ล่าสุด:" -ForegroundColor Gray
    git log --oneline -1
} else {
    Write-Host "⚠️  ไม่มีอะไรให้ commit (อาจจะ commit ไปแล้ว)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Check remote
Write-Host "[4/5] ตรวจสอบ remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  ไม่พบ remote!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "กรุณาเพิ่ม remote ก่อน:" -ForegroundColor Yellow
    Write-Host "1. ไปที่: https://github.com/new" -ForegroundColor White
    Write-Host "2. สร้าง repository" -ForegroundColor White
    Write-Host "3. คัดลอก URL" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "ใส่ GitHub repository URL"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ เพิ่ม remote สำเร็จ" -ForegroundColor Green
        } else {
            Write-Host "✗ ไม่สามารถเพิ่ม remote ได้" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ ไม่มี URL" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
}
Write-Host ""

# Step 5: Push
Write-Host "[5/5] Push ขึ้น GitHub..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Null
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ PUSH สำเร็จ!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 ขั้นตอนต่อไป (สำคัญมาก!):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. ไปที่ Vercel Dashboard:" -ForegroundColor White
    Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. คลิกโปรเจ็กต์: pim-learning-platform" -ForegroundColor White
    Write-Host ""
    Write-Host "3. ไปที่แท็บ 'Deployments'" -ForegroundColor White
    Write-Host ""
    Write-Host "4. คลิก 3 dots (⋮) บน deployment ล่าสุด" -ForegroundColor White
    Write-Host ""
    Write-Host "5. เลือก 'Redeploy'" -ForegroundColor White
    Write-Host ""
    Write-Host "6. รอ 2-3 นาที" -ForegroundColor White
    Write-Host ""
    Write-Host "7. ไปที่เว็บ: https://pim-learning-platform.vercel.app" -ForegroundColor White
    Write-Host ""
    Write-Host "8. กด Ctrl+Shift+R หรือ Ctrl+F5 (Hard Refresh)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ PUSH ไม่สำเร็จ" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
    Write-Host "   - Username: GitHub username ของคุณ" -ForegroundColor White
    Write-Host "   - Password: ใช้ Personal Access Token (ไม่ใช่ password จริง)" -ForegroundColor White
    Write-Host "   - สร้าง Token ได้ที่: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 ลอง push อีกครั้งด้วยคำสั่ง:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
}
Write-Host ""
