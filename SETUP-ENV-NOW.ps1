# 🔧 Setup Vercel Environment Variables - Quick Guide
# Script นี้จะช่วยคุณตั้งค่า REACT_APP_API_URL และ REACT_APP_SERVER_URL ใน Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Railway URL
Write-Host "[1/4] ตั้งค่า Railway Backend URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "กรุณาใส่ Railway Backend URL:" -ForegroundColor White
Write-Host "  ตัวอย่าง: https://pim-learning-platform-production.up.railway.app" -ForegroundColor Gray
Write-Host "  หรือ: https://your-app-name.railway.app" -ForegroundColor Gray
Write-Host ""
$railwayUrl = Read-Host "Railway URL"

if (-not $railwayUrl) {
    Write-Host "❌ ต้องใส่ Railway URL" -ForegroundColor Red
    exit 1
}

# Clean URL
$railwayUrl = $railwayUrl.Trim().TrimEnd('/')

# Construct URLs
$apiUrl = "$railwayUrl/api"
$serverUrl = $railwayUrl

Write-Host ""
Write-Host "✅ URLs ที่จะใช้:" -ForegroundColor Green
Write-Host "   Railway URL: $railwayUrl" -ForegroundColor White
Write-Host "   API URL: $apiUrl" -ForegroundColor White
Write-Host "   Server URL: $serverUrl" -ForegroundColor White
Write-Host ""

# Step 2: Check Vercel CLI
Write-Host "[2/4] ตรวจสอบ Vercel CLI" -ForegroundColor Yellow
Write-Host ""

$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI ไม่พบ" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ติดตั้ง Vercel CLI:" -ForegroundColor White
    Write-Host "   npm install -g vercel" -ForegroundColor Gray
    Write-Host ""
    $install = Read-Host "ต้องการติดตั้งตอนนี้ไหม? (y/n)"
    if ($install -eq 'y' -or $install -eq 'Y') {
        npm install -g vercel
    } else {
        Write-Host "❌ ต้องติดตั้ง Vercel CLI ก่อน" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Vercel CLI พร้อมใช้งาน" -ForegroundColor Green
Write-Host ""

# Step 3: Login to Vercel (if needed)
Write-Host "[3/4] ตรวจสอบ Vercel Login" -ForegroundColor Yellow
Write-Host ""

$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  ยังไม่ได้ login Vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "กำลังเปิด Vercel login..." -ForegroundColor White
    vercel login
} else {
    Write-Host "✅ Login แล้ว: $vercelWhoami" -ForegroundColor Green
}

Write-Host ""

# Step 4: Set Environment Variables
Write-Host "[4/4] ตั้งค่า Environment Variables" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 คำสั่งที่จะรัน:" -ForegroundColor White
Write-Host ""
Write-Host "Production:" -ForegroundColor Cyan
Write-Host "  echo '$apiUrl' | vercel env add REACT_APP_API_URL production" -ForegroundColor Gray
Write-Host "  echo '$serverUrl' | vercel env add REACT_APP_SERVER_URL production" -ForegroundColor Gray
Write-Host ""
Write-Host "Preview:" -ForegroundColor Cyan
Write-Host "  echo '$apiUrl' | vercel env add REACT_APP_API_URL preview" -ForegroundColor Gray
Write-Host "  echo '$serverUrl' | vercel env add REACT_APP_SERVER_URL preview" -ForegroundColor Gray
Write-Host ""
Write-Host "Development:" -ForegroundColor Cyan
Write-Host "  echo 'http://localhost:5000/api' | vercel env add REACT_APP_API_URL development" -ForegroundColor Gray
Write-Host "  echo 'http://localhost:5000' | vercel env add REACT_APP_SERVER_URL development" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "ต้องการรันคำสั่งเหล่านี้ไหม? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ ยกเลิก" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "กำลังตั้งค่า..." -ForegroundColor Yellow
Write-Host ""

# Production
Write-Host "Setting Production..." -ForegroundColor Cyan
echo $apiUrl | vercel env add REACT_APP_API_URL production
echo $serverUrl | vercel env add REACT_APP_SERVER_URL production

# Preview
Write-Host "Setting Preview..." -ForegroundColor Cyan
echo $apiUrl | vercel env add REACT_APP_API_URL preview
echo $serverUrl | vercel env add REACT_APP_SERVER_URL preview

# Development
Write-Host "Setting Development..." -ForegroundColor Cyan
echo "http://localhost:5000/api" | vercel env add REACT_APP_API_URL development
echo "http://localhost:5000" | vercel env add REACT_APP_SERVER_URL development

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ตั้งค่าเสร็จแล้ว!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ต้องทำต่อ:" -ForegroundColor Cyan
Write-Host "1. ไปที่: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. เลือกโปรเจ็กต์: pim-learning-platform" -ForegroundColor White
Write-Host "3. ไปที่ Settings → Environment Variables" -ForegroundColor White
Write-Host "4. ตรวจสอบว่า REACT_APP_API_URL และ REACT_APP_SERVER_URL ถูกตั้งค่าแล้ว" -ForegroundColor White
Write-Host "5. ไปที่ Deployments → คลิก 3 dots (...) → Redeploy" -ForegroundColor White
Write-Host "6. รอ 2-3 นาที แล้ว refresh หน้าเว็บ (Ctrl+F5)" -ForegroundColor White
Write-Host ""

