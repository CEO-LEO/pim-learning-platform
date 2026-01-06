# 🔧 Vercel Environment Variables Setup

## ⚠️ ปัญหา: วิดีโอไม่ขึ้น

วิดีโอไม่ขึ้นเพราะ Vercel ไม่มี environment variables สำหรับเชื่อมต่อกับ Railway backend

## ✅ วิธีแก้ไข

### 1. ไปที่ Vercel Dashboard

1. เปิด: https://vercel.com/dashboard
2. เลือกโปรเจ็กต์: **pim-learning-platform**
3. ไปที่ **Settings** → **Environment Variables**

### 2. เพิ่ม Environment Variables

เพิ่มตัวแปรต่อไปนี้:

#### สำหรับ Production:
- **Name:** `REACT_APP_API_URL`
- **Value:** `https://[YOUR_RAILWAY_URL]/api`
  - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app/api`
- **Environment:** Production ✅

#### สำหรับ Preview:
- **Name:** `REACT_APP_API_URL`
- **Value:** `https://[YOUR_RAILWAY_URL]/api`
- **Environment:** Preview ✅

#### สำหรับ Development:
- **Name:** `REACT_APP_API_URL`
- **Value:** `http://localhost:5000/api`
- **Environment:** Development ✅

### 3. (Optional) เพิ่ม SERVER_URL

ถ้า Railway URL ต่างจาก API URL:

- **Name:** `REACT_APP_SERVER_URL`
- **Value:** `https://[YOUR_RAILWAY_URL]`
  - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app`
- **Environment:** Production, Preview ✅

### 4. Redeploy

หลังจากเพิ่ม environment variables แล้ว:

1. ไปที่ **Deployments**
2. คลิก **3 dots (...)** บน deployment ล่าสุด
3. เลือก **Redeploy**
4. รอ 2-3 นาที
5. Refresh หน้าเว็บ (Ctrl+F5)

## 🔍 วิธีหา Railway URL

1. ไปที่ Railway Dashboard: https://railway.app/dashboard
2. เลือกโปรเจ็กต์ backend
3. ไปที่ **Settings** → **Domains**
4. Copy **Default Domain** หรือ **Custom Domain**

## ✅ ตรวจสอบ

หลังจาก redeploy แล้ว:

1. เปิด Developer Tools (F12)
2. ไปที่ Console tab
3. ดู log: `[VideoPlayer] Constructed URL:`
4. ตรวจสอบว่า URL ถูกต้องหรือไม่

## 🐛 Troubleshooting

### วิดีโอยังไม่ขึ้น

1. **ตรวจสอบ Console:**
   - เปิด F12 → Console
   - ดู error messages
   - ตรวจสอบว่า API URL ถูกต้องหรือไม่

2. **ตรวจสอบ Network:**
   - เปิด F12 → Network
   - ลองเปิดวิดีโอ
   - ดู request ไปที่ `/api/videos/[videoId]`
   - ตรวจสอบ status code (ควรเป็น 200)

3. **ตรวจสอบ CORS:**
   - ดู error: `CORS policy: No 'Access-Control-Allow-Origin'`
   - ไปที่ Railway → Settings → Environment Variables
   - เพิ่ม `ALLOWED_ORIGINS` = `https://pim-learning-platform.vercel.app`

4. **ตรวจสอบ Railway:**
   - ดู Railway logs
   - ตรวจสอบว่า server รันอยู่หรือไม่
   - ตรวจสอบว่า Git LFS files ถูก pull แล้วหรือไม่

## 📝 หมายเหตุ

- Environment variables จะถูก inject ใน build time
- ต้อง redeploy หลังจากเพิ่ม/แก้ไข environment variables
- ใช้ `REACT_APP_` prefix สำหรับ React environment variables

