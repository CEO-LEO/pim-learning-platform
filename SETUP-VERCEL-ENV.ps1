# Setup Vercel Environment Variables
# This script helps you set up REACT_APP_API_URL for Vercel deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 ตั้งค่า Vercel Environment Variables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI ไม่พบ!" -ForegroundColor Red
    Write-Host "ติดตั้งด้วย: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ พบ Vercel CLI" -ForegroundColor Green
Write-Host ""

# Get Railway URL
Write-Host "📋 กรุณาใส่ Railway Backend URL:" -ForegroundColor Yellow
Write-Host "   ตัวอย่าง: https://pim-learning-platform-production.up.railway.app" -ForegroundColor Gray
$railwayUrl = Read-Host "Railway URL"

if (-not $railwayUrl) {
    Write-Host "❌ ต้องใส่ Railway URL" -ForegroundColor Red
    exit 1
}

# Remove trailing slash
$railwayUrl = $railwayUrl.TrimEnd('/')

# Construct API URL
$apiUrl = "$railwayUrl/api"

Write-Host ""
Write-Host "📝 ข้อมูลที่จะตั้งค่า:" -ForegroundColor Yellow
Write-Host "   Railway URL: $railwayUrl" -ForegroundColor White
Write-Host "   API URL: $apiUrl" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "ยืนยันการตั้งค่า? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ ยกเลิกการตั้งค่า" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔐 กำลัง login Vercel..." -ForegroundColor Yellow
Write-Host "   (ถ้ายังไม่ login จะเปิดเบราว์เซอร์ให้ login)" -ForegroundColor Gray

# Check if already logged in
$loginCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ต้อง login ก่อน..." -ForegroundColor Yellow
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login ไม่สำเร็จ" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Login สำเร็จ" -ForegroundColor Green
Write-Host ""

# Get project name
Write-Host "🔍 กำลังหาโปรเจ็กต์..." -ForegroundColor Yellow
$projectName = "pim-learning-platform"

Write-Host ""
Write-Host "📦 ตั้งค่า Environment Variables..." -ForegroundColor Yellow
Write-Host ""

# Set for Production
Write-Host "[1/3] ตั้งค่า Production..." -ForegroundColor Cyan
Write-Host "   กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
$result = vercel env add REACT_APP_API_URL production 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Production: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Production อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
    Write-Host "   ลองตั้งด้วยตนเอง: vercel env add REACT_APP_API_URL production" -ForegroundColor Gray
    Write-Host "   (ใส่ค่า: $apiUrl)" -ForegroundColor Gray
}

# Set for Preview
Write-Host "[2/3] ตั้งค่า Preview..." -ForegroundColor Cyan
Write-Host "   กรุณาใส่ค่า: $apiUrl" -ForegroundColor Gray
$result = vercel env add REACT_APP_API_URL preview 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Preview: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Preview อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
    Write-Host "   ลองตั้งด้วยตนเอง: vercel env add REACT_APP_API_URL preview" -ForegroundColor Gray
    Write-Host "   (ใส่ค่า: $apiUrl)" -ForegroundColor Gray
}

# Set for Development
Write-Host "[3/3] ตั้งค่า Development..." -ForegroundColor Cyan
$devUrl = "http://localhost:5000/api"
Write-Host "   กรุณาใส่ค่า: $devUrl" -ForegroundColor Gray
$result = vercel env add REACT_APP_API_URL development 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Development: $devUrl" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Development อาจจะตั้งไว้แล้ว หรือมีปัญหา" -ForegroundColor Yellow
    Write-Host "   ลองตั้งด้วยตนเอง: vercel env add REACT_APP_API_URL development" -ForegroundColor Gray
    Write-Host "   (ใส่ค่า: $devUrl)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ ตั้งค่าเสร็จแล้ว!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 ต้องทำต่อ:" -ForegroundColor Cyan
Write-Host "1. ไปที่: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. เลือกโปรเจ็กต์: $projectName" -ForegroundColor White
Write-Host "3. ไปที่ Settings → Environment Variables" -ForegroundColor White
Write-Host "4. ตรวจสอบว่า REACT_APP_API_URL ถูกตั้งค่าแล้ว" -ForegroundColor White
Write-Host "5. ไปที่ Deployments → คลิก 3 dots (...) → Redeploy" -ForegroundColor White
Write-Host "6. รอ 2-3 นาที แล้วลองเปิดวิดีโออีกครั้ง" -ForegroundColor White
Write-Host ""
Write-Host "💡 หรือใช้คำสั่งนี้เพื่อตั้งค่าด้วยตนเอง:" -ForegroundColor Yellow
Write-Host "   vercel env add REACT_APP_API_URL production" -ForegroundColor Gray
Write-Host "   (ใส่ค่า: $apiUrl)" -ForegroundColor Gray
Write-Host ""

