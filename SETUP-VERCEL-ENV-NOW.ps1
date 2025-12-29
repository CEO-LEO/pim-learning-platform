# Setup Vercel Environment Variables - Auto Setup
# This script will help you set up REACT_APP_API_URL automatically

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

# Check if logged in
Write-Host "ตรวจสอบการ login..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ยังไม่ได้ login" -ForegroundColor Yellow
    Write-Host "กำลังเปิดเบราว์เซอร์ให้ login..." -ForegroundColor Yellow
    Write-Host ""
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Login ไม่สำเร็จ" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Login แล้ว: $whoami" -ForegroundColor Green
}

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
Write-Host "กำลังตั้งค่า Environment Variables..." -ForegroundColor Yellow
Write-Host ""

# Set for Production
Write-Host "[1/3] ตั้งค่า Production..." -ForegroundColor Cyan
Write-Host "กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
echo $apiUrl | vercel env add REACT_APP_API_URL production
if ($LASTEXITCODE -eq 0) {
    Write-Host "Production: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "Production อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
}

Write-Host ""

# Set for Preview
Write-Host "[2/3] ตั้งค่า Preview..." -ForegroundColor Cyan
Write-Host "กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
echo $apiUrl | vercel env add REACT_APP_API_URL preview
if ($LASTEXITCODE -eq 0) {
    Write-Host "Preview: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "Preview อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
}

Write-Host ""

# Set for Development
Write-Host "[3/3] ตั้งค่า Development..." -ForegroundColor Cyan
$devUrl = "http://localhost:5000/api"
Write-Host "กรุณาใส่ค่า: $devUrl" -ForegroundColor Gray
echo $devUrl | vercel env add REACT_APP_API_URL development
if ($LASTEXITCODE -eq 0) {
    Write-Host "Development: $devUrl" -ForegroundColor Green
} else {
    Write-Host "Development อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "ตั้งค่าเสร็จแล้ว!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "กำลัง redeploy..." -ForegroundColor Yellow
vercel --prod --yes
Write-Host ""
Write-Host "เสร็จแล้ว! รอ 2-3 นาที แล้วลองเปิดวิดีโออีกครั้ง" -ForegroundColor Green
Write-Host ""

