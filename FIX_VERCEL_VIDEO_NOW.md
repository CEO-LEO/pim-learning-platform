# 🚨 แก้ปัญหา Vercel Video ทันที

## ปัญหา
วิดีโอไม่แสดงเพราะ URL ในฐานข้อมูลเป็น localhost

## วิธีแก้เร็วที่สุด

### วิธีที่ 1: ใช้ Environment Variable (แนะนำ)

**ตั้งค่าใน Vercel:**
1. ไปที่ Vercel Dashboard → Settings → Environment Variables
2. เพิ่ม: `REACT_APP_API_URL` = `https://your-backend.railway.app/api`
3. Redeploy

**VideoPlayer.js จะใช้ `REACT_APP_API_URL` อัตโนมัติ**

### วิธีที่ 2: อัปเดต URL ในฐานข้อมูล

```powershell
# ตั้งค่า backend URL
$env:BACKEND_URL="https://your-backend.railway.app"

# อัปเดต URL
node server/scripts/fix-video-urls-production.js

# Push และ redeploy
git add server/database/pim_learning.db
git commit -m "Update video URLs for production"
git push
```

## ⚠️ สำคัญ

**ต้องทำทั้ง 2 อย่าง:**
1. ตั้งค่า `REACT_APP_API_URL` ใน Vercel
2. อัปเดต URL ในฐานข้อมูล

## ตรวจสอบ Backend URL

ถ้ายังไม่รู้ backend URL:
1. ตรวจสอบ Railway/Render/Heroku dashboard
2. หรือดูจาก Network tab ใน browser (ดูว่า API request ไปที่ไหน)

