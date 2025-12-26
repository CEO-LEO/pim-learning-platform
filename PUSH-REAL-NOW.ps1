# Push Code REAL - ทำงานแน่นอน
Write-Host "========================================" -ForegroundColor Red
Write-Host "🚀 PUSH CODE จริงๆ ขึ้นเซิร์ฟเวอร์" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Check git status
Write-Host "📋 ตรวจสอบสถานะ Git..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "ไฟล์ที่เปลี่ยนแปลง:" -ForegroundColor Gray
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
} else {
    Write-Host "ℹ️  ไม่มีไฟล์ที่เปลี่ยนแปลง" -ForegroundColor Gray
    Write-Host ""
}

# Add all files
Write-Host "📦 เพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
git add -A
Write-Host "✓ สำเร็จ" -ForegroundColor Green
Write-Host ""

# Commit
Write-Host "💾 Commit..." -ForegroundColor Yellow
$commitMsg = "Update: แก้ไขข้อความ เริ่มต้นทำธุรกิจ->หลักสูตรทั้งหมด, เข้าสู่บทเรียน->เริ่มต้นบทเรียน, แก้ deprecation warning"
git commit -m $commitMsg
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit สำเร็จ" -ForegroundColor Green
    Write-Host ""
    Write-Host "Commit ล่าสุด:" -ForegroundColor Gray
    git log --oneline -1
    Write-Host ""
} else {
    Write-Host "⚠️  ไม่มีอะไรให้ commit" -ForegroundColor Yellow
    Write-Host ""
}

# Check remote
Write-Host "🔍 ตรวจสอบ remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ ไม่พบ remote!" -ForegroundColor Red
    Write-Host ""
    Write-Host "กรุณาเพิ่ม remote:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
    exit 1
}

# Push
Write-Host "📤 Push ขึ้น GitHub..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Null
git push origin main

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
    Write-Host "⚠️  สำคัญ: ต้อง Hard Refresh ถึงจะเห็นการเปลี่ยนแปลง!" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ PUSH ไม่สำเร็จ" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
    Write-Host "   - Username: GitHub username" -ForegroundColor White
    Write-Host "   - Password: Personal Access Token" -ForegroundColor White
    Write-Host "   - สร้างได้ที่: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 ลอง push อีกครั้ง:" -ForegroundColor Yellow
    Write-Host "   git push origin main" -ForegroundColor Cyan
    Write-Host ""
}
Write-Host ""

