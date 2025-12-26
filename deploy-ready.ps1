# Deploy Ready Script - Commit and Push All Changes
Write-Host "🚀 Preparing for Deployment" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Initialize Git if needed
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Add all files
Write-Host "📝 Adding all files..." -ForegroundColor Yellow
git add -A
Write-Host "✓ Files added" -ForegroundColor Green
Write-Host ""

# Step 3: Check if there are changes to commit
$status = git status --short
if ($status -or (git diff --cached --quiet; -not $LASTEXITCODE)) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    $commitMessage = @"
Update: เพิ่มวิดีโอใหม่สำหรับทุก module, ปรับปรุง UI และแก้ไขข้อความ

- เพิ่มวิดีโอสำหรับ module การบริการ (2 วิดีโอ)
- เพิ่มวิดีโอสำหรับ module การเตรียมสินค้าอุ่นร้อน (1 วิดีโอ)
- เพิ่มวิดีโอสำหรับ module การจัดการอุปกรณ์และความสะอาด (2 วิดีโอ)
- เพิ่มวิดีโอสำหรับ module การจัดการและบริหารสินค้า (3 วิดีโอ)
- ปรับปรุง UI ให้มีขนาดเหมาะสมกับผู้ใช้
- แก้ไขข้อความ "เริ่มต้นทำธุรกิจ" เป็น "หลักสูตรทั้งหมด"
- แก้ไขข้อความ "เข้าสู่บทเรียน" เป็น "เริ่มต้นบทเรียน"
- แก้ไขสถิติเวลาเรียนให้แสดงนาที/ชั่วโมงตามความเหมาะสม
- เพิ่ม autoplay สำหรับวิดีโอ
"@
    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Commit successful" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "❌ Commit failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Gray
    Write-Host ""
}

# Step 4: Check remote
Write-Host "🔍 Checking remote repository..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "⚠️  No GitHub remote configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create a GitHub repository first:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor White
    Write-Host "2. Create repository (e.g., pim-learning-platform)" -ForegroundColor White
    Write-Host "3. Do NOT check 'Initialize with README'" -ForegroundColor White
    Write-Host "4. Click 'Create repository'" -ForegroundColor White
    Write-Host "5. Copy the repository URL" -ForegroundColor White
    Write-Host ""
    $repoUrl = Read-Host "Enter GitHub repository URL (e.g., https://github.com/username/repo.git)"
    
    if ($repoUrl) {
        Write-Host ""
        Write-Host "Adding remote..." -ForegroundColor Yellow
        git remote add origin $repoUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Remote added successfully" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "❌ Failed to add remote" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ No URL provided" -ForegroundColor Red
        Write-Host ""
        Write-Host "You can add remote later with:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Cyan
        Write-Host "  git push -u origin main" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✓ Remote: $remote" -ForegroundColor Green
    Write-Host ""
}

# Step 5: Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main 2>&1 | Out-Null
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! Code pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
    Write-Host "2. Find your project: pim-learning-platform" -ForegroundColor Yellow
    Write-Host "3. Click on the project" -ForegroundColor Yellow
    Write-Host "4. Go to 'Deployments' tab" -ForegroundColor Yellow
    Write-Host "5. Click the 3 dots (⋮) on the latest deployment" -ForegroundColor Yellow
    Write-Host "6. Click 'Redeploy'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   OR Vercel will auto-redeploy in 1-2 minutes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "7. Wait for deployment to complete (~2-3 minutes)" -ForegroundColor Yellow
    Write-Host "8. Visit: https://pim-learning-platform.vercel.app" -ForegroundColor Yellow
    Write-Host "9. Hard refresh the page (Ctrl+F5 or Ctrl+Shift+R)" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 If GitHub asks for Username/Password:" -ForegroundColor Yellow
    Write-Host "   - Username: Your GitHub username" -ForegroundColor White
    Write-Host "   - Password: Use Personal Access Token (NOT your password)" -ForegroundColor White
    Write-Host "   - Create token at: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   - Select scope: repo" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Or try pushing manually:" -ForegroundColor Yellow
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
}

