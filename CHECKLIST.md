# ✅ Checklist สำหรับ Video Loading Issue

## 🔍 สิ่งที่ต้องตรวจสอบ:

### 1. Railway Deployment Status
- [ ] ตรวจสอบ Railway build logs - Git LFS pull สำเร็จหรือไม่?
- [ ] ตรวจสอบ Railway service status - Online หรือไม่?
- [ ] ตรวจสอบ Railway logs - มี error messages หรือไม่?

### 2. Video Files
- [ ] ทดสอบ `/api/health` endpoint - `videoFiles.hasFiles` = `true`?
- [ ] ตรวจสอบ `videoFiles.fileCount` - มีไฟล์วิดีโอหรือไม่?
- [ ] ตรวจสอบ `videoFiles.hasLfsPointers` - มี Git LFS pointer files หรือไม่?

### 3. Environment Variables
- [ ] Vercel: `REACT_APP_API_URL` = `https://your-railway-url.up.railway.app/api`
- [ ] Railway: `JWT_SECRET` = ตั้งค่าแล้ว

### 4. Browser Console
- [ ] เปิด F12 → Console tab
- [ ] ดู `[VideoPlayer] Environment Variables:` - `API_URL` ถูกต้องหรือไม่?
- [ ] ดู `[VideoPlayer] Pre-flight check failed:` - มี error หรือไม่?
- [ ] ดู Network tab - HEAD request ไปที่ `/api/videos/stream/...` มี status code เท่าไหร่?

### 5. Railway Build Logs
- [ ] `=== Pulling Git LFS files ===` - สำเร็จหรือไม่?
- [ ] `Git LFS pull exit code:` - เป็น 0 หรือไม่?
- [ ] `Found X video files` - มีไฟล์วิดีโอหรือไม่?

## 🚨 ปัญหาที่เป็นไปได้:

### ถ้า Git LFS pull ล้มเหลว:
- Railway อาจไม่รองรับ Git LFS
- **วิธีแก้:** ใช้ Railway Volumes หรือ external storage (Cloudinary/S3)

### ถ้า video files ไม่มี:
- Git LFS files ไม่ถูก pull
- **วิธีแก้:** ตรวจสอบ Railway build logs และใช้ Railway Volumes

### ถ้า API_URL ไม่ถูกต้อง:
- Vercel environment variable ไม่ถูกตั้งค่า
- **วิธีแก้:** ตั้งค่า `REACT_APP_API_URL` ใน Vercel dashboard

### ถ้า Authentication ล้มเหลว:
- Token ไม่ถูกต้องหรือหมดอายุ
- **วิธีแก้:** Login ใหม่

## 📝 ขั้นตอนการแก้ไข:

1. ตรวจสอบ Railway build logs
2. ทดสอบ `/api/health` endpoint
3. ตรวจสอบ Browser Console logs
4. ตรวจสอบ Network tab
5. ส่งข้อมูลทั้งหมดมาให้ฉันเพื่อวิเคราะห์ต่อ

