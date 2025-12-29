# 🔧 ตั้งค่า Environment Variables ใน Vercel (Manual)

## 📋 ขั้นตอนที่ 1: หา Railway Backend URL

1. ไปที่: https://railway.app/dashboard
2. เลือกโปรเจ็กต์ backend ของคุณ
3. ไปที่ **Settings** → **Domains**
4. Copy **Default Domain** หรือ **Custom Domain**
   - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app`

---

## 📋 ขั้นตอนที่ 2: ไปที่ Vercel Dashboard

1. เปิด: https://vercel.com/dashboard
2. เลือกโปรเจ็กต์: **pim-learning-platform**
3. ไปที่ **Settings** → **Environment Variables**

---

## 📋 ขั้นตอนที่ 3: เพิ่ม Environment Variables

### สำหรับ Production:

1. คลิก **Add New**
2. **Key:** `REACT_APP_API_URL`
3. **Value:** `https://[YOUR_RAILWAY_URL]/api`
   - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app/api`
4. เลือก **Production** ✅
5. คลิก **Save**

6. คลิก **Add New** อีกครั้ง
7. **Key:** `REACT_APP_SERVER_URL`
8. **Value:** `https://[YOUR_RAILWAY_URL]`
   - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app`
9. เลือก **Production** ✅
10. คลิก **Save**

### สำหรับ Preview:

ทำเหมือนกับ Production แต่เลือก **Preview** ✅ แทน

### สำหรับ Development:

1. **Key:** `REACT_APP_API_URL`
2. **Value:** `http://localhost:5000/api`
3. เลือก **Development** ✅

4. **Key:** `REACT_APP_SERVER_URL`
5. **Value:** `http://localhost:5000`
6. เลือก **Development** ✅

---

## 📋 ขั้นตอนที่ 4: Redeploy

1. ไปที่ **Deployments**
2. คลิก **3 dots (...)** บน deployment ล่าสุด
3. เลือก **Redeploy**
4. รอ 2-3 นาที
5. Refresh หน้าเว็บ (Ctrl+F5)

---

## ✅ ตรวจสอบ

### 1. ตรวจสอบ Environment Variables

1. ไปที่ Vercel Dashboard → Settings → Environment Variables
2. ตรวจสอบว่ามี:
   - `REACT_APP_API_URL` (Production, Preview, Development)
   - `REACT_APP_SERVER_URL` (Production, Preview, Development)

### 2. ตรวจสอบใน Browser

1. เปิดเว็บไซต์
2. กด F12 เพื่อเปิด Developer Tools
3. ไปที่ **Console** tab
4. ดู log: `[VideoPlayer] Environment Variables:`
5. ตรวจสอบว่า:
   - `REACT_APP_API_URL` ถูกต้อง
   - `REACT_APP_SERVER_URL` ถูกต้อง
   - `SERVER_URL` ถูกต้อง

### 3. ตรวจสอบ Network Requests

1. เปิด Developer Tools → **Network** tab
2. ลองเปิดวิดีโอ
3. ดู request ไปที่:
   - `/api/videos/[videoId]` → ควรได้ status 200
   - `/uploads/videos/video-module_X-Y.mp4` → ควรได้ status 200

---

## 🐛 Troubleshooting

### ❌ วิดีโอยังไม่ขึ้น

1. **ตรวจสอบ Console:**
   - เปิด F12 → Console
   - ดู error messages
   - ตรวจสอบว่า API URL ถูกต้องหรือไม่

2. **ตรวจสอบ Network:**
   - เปิด F12 → Network
   - ลองเปิดวิดีโอ
   - ดู request ไปที่ video URL
   - ตรวจสอบ status code:
     - `200`: OK ✅
     - `404`: ไฟล์ไม่พบ ❌
     - `403`: CORS หรือ permission issue ❌
     - `500`: Server error ❌

3. **ตรวจสอบ CORS:**
   - ดู error: `CORS policy: No 'Access-Control-Allow-Origin'`
   - ไปที่ Railway → Settings → Environment Variables
   - เพิ่ม `ALLOWED_ORIGINS` = `https://pim-learning-platform.vercel.app,https://pim-learning-platform-*.vercel.app`

4. **ตรวจสอบ Railway:**
   - ดู Railway logs
   - ตรวจสอบว่า server รันอยู่หรือไม่
   - ตรวจสอบว่า Git LFS files ถูก pull แล้วหรือไม่

---

## 📝 หมายเหตุ

- Environment variables จะถูก inject ใน build time
- **ต้อง redeploy** หลังจากเพิ่ม/แก้ไข environment variables
- ใช้ `REACT_APP_` prefix สำหรับ React environment variables
- `REACT_APP_SERVER_URL` ใช้สำหรับ video URLs (ไม่ต้องใส่ `/api` ต่อท้าย)
- `REACT_APP_API_URL` ใช้สำหรับ API calls (ต้องมี `/api` ต่อท้าย)

