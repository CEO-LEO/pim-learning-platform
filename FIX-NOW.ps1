# Fix and Push NOW
Write-Host "========================================" -ForegroundColor Red
Write-Host "🔧 แก้ไขและ Push เดี๋ยวนี้" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Step 1: Add all
Write-Host "[1/4] เพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
git add -A
Write-Host "✓" -ForegroundColor Green
Write-Host ""

# Step 2: Commit
Write-Host "[2/4] Commit..." -ForegroundColor Yellow
git commit -m 'Fix: แก้ไขข้อความ เริ่มต้นทำธุรกิจ->หลักสูตรทั้งหมด, เข้าสู่บทเรียน->เริ่มต้นบทเรียน'
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "⚠️  ไม่มีอะไรให้ commit" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check remote
Write-Host "[3/4] ตรวจสอบ remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
} else {
    Write-Host "❌ ไม่พบ remote!" -ForegroundColor Red
    Write-Host 'เพิ่ม remote: git remote add origin <url>' -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Push
Write-Host "[4/4] Push..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Null
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ PUSH สำเร็จ!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host '📋 ต้องทำต่อ:' -ForegroundColor Cyan
    Write-Host '1. ไปที่: https://vercel.com/dashboard' -ForegroundColor White
    Write-Host '2. คลิกโปรเจ็กต์: pim-learning-platform' -ForegroundColor White
    Write-Host '3. ไปที่ Deployments' -ForegroundColor White
    Write-Host '4. คลิก 3 dots (...) -> Redeploy' -ForegroundColor White
    Write-Host '5. รอ 2-3 นาที' -ForegroundColor White
    Write-Host '6. Refresh หน้าเว็บ (Ctrl+F5)' -ForegroundColor White
} else {
    Write-Host ""
    Write-Host '❌ PUSH ไม่สำเร็จ' -ForegroundColor Red
    Write-Host 'ลอง: git push origin main' -ForegroundColor Yellow
}
Write-Host ""
