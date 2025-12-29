# Setup Vercel Environment Variables - Simple Version
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ตั้งค่า Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI ไม่พบ! ติดตั้งด้วย: npm install -g vercel" -ForegroundColor Red
    exit 1
}

Write-Host "พบ Vercel CLI" -ForegroundColor Green
Write-Host ""

# Get Railway URL
Write-Host "กรุณาใส่ Railway Backend URL:" -ForegroundColor Yellow
Write-Host "ตัวอย่าง: https://pim-learning-platform-production.up.railway.app" -ForegroundColor Gray
$railwayUrl = Read-Host "Railway URL"

if (-not $railwayUrl) {
    Write-Host "ต้องใส่ Railway URL" -ForegroundColor Red
    exit 1
}

$railwayUrl = $railwayUrl.TrimEnd('/')
$apiUrl = "$railwayUrl/api"

Write-Host ""
Write-Host "ข้อมูลที่จะตั้งค่า:" -ForegroundColor Yellow
Write-Host "Railway URL: $railwayUrl" -ForegroundColor White
Write-Host "API URL: $apiUrl" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "ยืนยันการตั้งค่า? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "ยกเลิกการตั้งค่า" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "กำลัง login Vercel..." -ForegroundColor Yellow
Write-Host "(ถ้ายังไม่ login จะเปิดเบราว์เซอร์ให้ login)" -ForegroundColor Gray

# Check login
vercel whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ต้อง login ก่อน..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login ไม่สำเร็จ" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Login สำเร็จ" -ForegroundColor Green
Write-Host ""

Write-Host "ตั้งค่า Environment Variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "สำหรับ Production:" -ForegroundColor Cyan
Write-Host "กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
vercel env add REACT_APP_API_URL production

Write-Host ""
Write-Host "สำหรับ Preview:" -ForegroundColor Cyan
Write-Host "กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
vercel env add REACT_APP_API_URL preview

Write-Host ""
Write-Host "สำหรับ Development:" -ForegroundColor Cyan
$devUrl = "http://localhost:5000/api"
Write-Host "กรุณาใส่ค่า: $devUrl" -ForegroundColor Gray
vercel env add REACT_APP_API_URL development

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ตั้งค่าเสร็จแล้ว!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ต้องทำต่อ:" -ForegroundColor Cyan
Write-Host "1. ไปที่: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. เลือกโปรเจ็กต์: pim-learning-platform" -ForegroundColor White
Write-Host "3. ไปที่ Deployments -> คลิก 3 dots (...) -> Redeploy" -ForegroundColor White
Write-Host "4. รอ 2-3 นาที แล้วลองเปิดวิดีโออีกครั้ง" -ForegroundColor White
Write-Host ""

