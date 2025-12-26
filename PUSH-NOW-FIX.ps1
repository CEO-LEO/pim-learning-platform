# Push Code to GitHub - FIX VERSION
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PUSH CODE ขึ้น GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Add all files
Write-Host "[1/4] เพิ่มไฟล์ทั้งหมด..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "✗ ล้มเหลว" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Commit
Write-Host "[2/4] Commit การเปลี่ยนแปลง..." -ForegroundColor Yellow
$commitMsg = "Update: แก้ไข UI, ข้อความ และเพิ่มวิดีโอ"
git commit -m $commitMsg
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "⚠️  ไม่มีอะไรให้ commit (อาจจะ commit ไปแล้ว)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check remote
Write-Host "[3/4] ตรวจสอบ remote repository..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Remote: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "✗ ไม่พบ remote!" -ForegroundColor Red
    Write-Host ""
    Write-Host "กรุณาเพิ่ม remote ก่อน:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-github-repo-url>" -ForegroundColor Cyan
    exit 1
}
Write-Host ""

# Step 4: Push
Write-Host "[4/4] Push ขึ้น GitHub..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Null
git push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ PUSH สำเร็จ!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 ขั้นตอนต่อไป:" -ForegroundColor Cyan
    Write-Host "1. ไปที่: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "2. คลิกโปรเจ็กต์: pim-learning-platform" -ForegroundColor White
    Write-Host "3. ไปที่แท็บ 'Deployments'" -ForegroundColor White
    Write-Host "4. คลิก 3 dots (⋮) → 'Redeploy'" -ForegroundColor White
    Write-Host "5. รอ 2-3 นาที" -ForegroundColor White
    Write-Host "6. Refresh หน้าเว็บ (Ctrl+F5)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ PUSH ไม่สำเร็จ" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 ถ้า GitHub ถาม Username/Password:" -ForegroundColor Yellow
    Write-Host "   Username: GitHub username" -ForegroundColor White
    Write-Host "   Password: Personal Access Token (สร้างที่ https://github.com/settings/tokens)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 ลอง push อีกครั้งด้วยคำสั่ง:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
}
Write-Host ""

