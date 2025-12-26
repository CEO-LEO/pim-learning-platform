# Push Code for REAL - ทำงานแน่นอน
Write-Host "========================================" -ForegroundColor Red
Write-Host "🚀 PUSH CODE จริงๆ" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Show current status
Write-Host "📋 สถานะปัจจุบัน:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Step 1: Add ALL files
Write-Host "[1/5] เพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
git add -A
Write-Host "✓ สำเร็จ" -ForegroundColor Green
Write-Host ""

# Step 2: Show what will be committed
Write-Host "[2/5] ไฟล์ที่จะ commit:" -ForegroundColor Yellow
git diff --cached --name-only
Write-Host ""

# Step 3: Commit
Write-Host "[3/5] Commit..." -ForegroundColor Yellow
$commitMsg = "Fix: แก้ไขข้อความ เริ่มต้นทำธุรกิจ -> หลักสูตรทั้งหมด, เข้าสู่บทเรียน -> เริ่มต้นบทเรียน"
git commit -m $commitMsg
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit สำเร็จ!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit failed หรือไม่มีอะไรให้ commit" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Show last commit
Write-Host "[4/5] Commit ล่าสุด:" -ForegroundColor Yellow
git log --oneline -1
Write-Host ""

# Step 5: Push
Write-Host "[5/5] Push ขึ้น GitHub..." -ForegroundColor Yellow
Write-Host ""

# Check remote
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "กำลัง push..." -ForegroundColor Yellow
    git branch -M main 2>&1 | Out-Null
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ PUSH สำเร็จ!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 ขั้นตอนต่อไป (สำคัญมาก!):" -ForegroundColor Cyan
        Write-Host "1. ไปที่ Vercel: https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "2. คลิกโปรเจ็กต์: pim-learning-platform" -ForegroundColor White
        Write-Host "3. ไปที่แท็บ 'Deployments'" -ForegroundColor White
        Write-Host "4. คลิก 3 dots (⋮) บน deployment ล่าสุด" -ForegroundColor White
        Write-Host "5. เลือก 'Redeploy'" -ForegroundColor White
        Write-Host "6. รอ 2-3 นาที" -ForegroundColor White
        Write-Host "7. ไปที่เว็บ: https://pim-learning-platform.vercel.app" -ForegroundColor White
        Write-Host "8. กด Ctrl+Shift+R หรือ Ctrl+F5 (Hard Refresh)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "❌ PUSH ไม่สำเร็จ!" -ForegroundColor Red
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
} else {
    Write-Host "❌ ไม่พบ remote!" -ForegroundColor Red
    Write-Host ""
    Write-Host "เพิ่ม remote ด้วย:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/username/repo.git" -ForegroundColor Cyan
    Write-Host ""
}
Write-Host ""

