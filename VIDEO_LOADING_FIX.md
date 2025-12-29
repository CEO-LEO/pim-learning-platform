# 🎥 แก้ไขปัญหาวิดีโอไม่โหลด

## ปัญหา
วิดีโอไม่สามารถโหลดได้ แสดง error "ไม่สามารถโหลดวิดีโอได้ กรุณาตรวจสอบ URL"

## สาเหตุที่เป็นไปได้

### 1. Backend Server ไม่มีไฟล์วิดีโอ
- ไฟล์วิดีโอถูก push ไปที่ GitHub ด้วย Git LFS แล้ว
- แต่ Railway backend server อาจจะไม่ pull Git LFS files ลงมา

**วิธีแก้:**
1. ไปที่ Railway Dashboard → Deployments
2. ตรวจสอบ build logs ว่ามี `git lfs pull` หรือไม่
3. ถ้าไม่มี ให้เพิ่มใน build command:
   ```bash
   git lfs install && git lfs pull && cd server && npm install && node index.js
   ```

### 2. Environment Variables ไม่ถูกต้อง
- `REACT_APP_SERVER_URL` ไม่ถูกตั้งค่าใน Vercel
- หรือ `REACT_APP_API_URL` ไม่ถูกต้อง

**วิธีแก้:**
1. ไปที่ Vercel Dashboard → Project Settings → Environment Variables
2. ตั้งค่า `REACT_APP_SERVER_URL` ให้ชี้ไปที่ Railway backend URL
   - ตัวอย่าง: `https://your-railway-app.railway.app`
   - **ไม่ต้องใส่** `/api` หรือ `/uploads` ต่อท้าย
3. ตั้งค่า `REACT_APP_API_URL` ให้ชี้ไปที่ Railway API
   - ตัวอย่าง: `https://your-railway-app.railway.app/api`
4. Redeploy ใน Vercel

### 3. CORS Issues
- Backend server อาจจะ block requests จาก Vercel domain

**วิธีแก้:**
1. ไปที่ Railway → Environment Variables
2. ตั้งค่า `ALLOWED_ORIGINS` ให้รวม Vercel domain:
   ```
   https://your-app.vercel.app,https://your-app-*.vercel.app
   ```

## ตรวจสอบ

### ตรวจสอบว่าไฟล์วิดีโอมีอยู่หรือไม่:
```bash
# SSH เข้า Railway
railway shell

# ตรวจสอบไฟล์
ls -lh server/uploads/videos/
```

### ตรวจสอบ Environment Variables:
1. เปิด Browser Console (F12)
2. ดู log `[VideoPlayer] Environment Variables:`
3. ตรวจสอบว่า `SERVER_URL` และ `API_URL` ถูกต้อง

### ตรวจสอบ Network Requests:
1. เปิด Browser DevTools → Network tab
2. ดู request ไปที่ video URL
3. ตรวจสอบ status code:
   - `200`: OK
   - `404`: ไฟล์ไม่พบ
   - `403`: CORS หรือ permission issue
   - `500`: Server error

## แนะนำ

สำหรับไฟล์วิดีโอขนาดใหญ่ (734 MB) แนะนำให้ใช้:
1. **External Storage** (Cloudinary, AWS S3, Google Cloud Storage)
2. **Railway Volume** สำหรับ persistent storage
3. **CDN** สำหรับ serving ไฟล์วิดีโอ

## สรุป

1. ✅ URL ใน database ถูกต้องแล้ว (`/uploads/videos/video-module_X-Y.mp4`)
2. ⚠️ ต้องตรวจสอบว่า Railway มีไฟล์วิดีโอหรือไม่
3. ⚠️ ต้องตั้งค่า `REACT_APP_SERVER_URL` ใน Vercel
4. ⚠️ ต้องตรวจสอบ CORS settings ใน Railway

