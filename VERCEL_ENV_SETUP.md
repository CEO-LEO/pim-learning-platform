# 🔧 ตั้งค่า Vercel Environment Variables สำหรับ Video

## ปัญหา
วิดีโอไม่แสดงเพราะ:
1. URL ในฐานข้อมูลเป็น localhost
2. ไม่ได้ตั้งค่า `REACT_APP_API_URL` ใน Vercel

## วิธีแก้

### ขั้นตอนที่ 1: หา Backend URL

ตรวจสอบว่า backend ของคุณอยู่ที่ไหน:

**Railway:**
1. ไปที่ https://railway.app/dashboard
2. เลือกโปรเจค
3. Settings → Networking → Public Domain
4. URL: `https://your-app.railway.app`

**Render:**
1. ไปที่ https://dashboard.render.com/
2. เลือก service
3. Settings → Public URL
4. URL: `https://your-app.onrender.com`

**Heroku:**
1. ไปที่ https://dashboard.heroku.com/
2. เลือก app
3. Settings → Domains
4. URL: `https://your-app.herokuapp.com`

### ขั้นตอนที่ 2: ตั้งค่า Vercel Environment Variables

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจค `pim-learning-platform`
3. ไปที่ **Settings** → **Environment Variables**
4. เพิ่ม environment variable:

   **Name:** `REACT_APP_API_URL`
   
   **Value:** `https://your-backend.railway.app/api`
   
   **Environment:** เลือก `Production`, `Preview`, และ `Development`

5. คลิก **Save**

### ขั้นตอนที่ 3: อัปเดต URL ในฐานข้อมูล

หลังจากตั้งค่า `REACT_APP_API_URL` แล้ว ให้อัปเดต URL ในฐานข้อมูล:

```powershell
# ตั้งค่า backend URL (ไม่ต้องมี /api)
$env:BACKEND_URL="https://your-backend.railway.app"

# อัปเดต URL ในฐานข้อมูล
node server/scripts/fix-video-urls-production.js
```

### ขั้นตอนที่ 4: Redeploy

1. ไปที่ Vercel Dashboard
2. เลือกโปรเจค
3. ไปที่ **Deployments**
4. คลิก **Redeploy** บน deployment ล่าสุด

หรือ push code ใหม่:
```bash
git commit --allow-empty -m "Trigger redeploy after env var update"
git push
```

## ตรวจสอบ

1. เปิดเบราว์เซอร์ไปที่หน้า video
2. กด F12 เปิด Developer Tools
3. ดู **Console** tab - ควรเห็น `REACT_APP_API_URL` ที่ถูกต้อง
4. ดู **Network** tab - ตรวจสอบว่า video request ไปที่ URL ถูกต้อง

## ⚠️ สิ่งสำคัญ

### ตรวจสอบว่า Backend มีไฟล์วิดีโอ

**สำคัญ:** ตรวจสอบว่า backend server มีไฟล์วิดีโอใน `server/uploads/videos/` หรือไม่

**ถ้าไม่มี:**
1. อัปโหลดไฟล์วิดีโอไปยัง backend server
2. หรือใช้ External Storage (Cloudflare R2, AWS S3)

## สรุป

1. ✅ ตั้งค่า `REACT_APP_API_URL` ใน Vercel
2. ✅ อัปเดต URL ในฐานข้อมูล
3. ✅ Redeploy
4. ✅ ตรวจสอบว่า backend มีไฟล์วิดีโอ
