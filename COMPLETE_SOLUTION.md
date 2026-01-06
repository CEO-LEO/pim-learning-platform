# 🎯 แก้ปัญหา Video ทั้งหมด - วิธีที่ง่ายที่สุด

## 🔍 ปัญหา

Backend ไม่มีไฟล์วิดีโอจริง (มีแค่ Git LFS pointers)

## ✅ วิธีแก้ (เลือก 1 วิธี)

### วิธีที่ 1: Railway Volume (ใช้ไฟล์ที่มีอยู่)

```powershell
# 1. สร้าง Volume ใน Railway Dashboard
#    - Mount path: /app/server/uploads/videos

# 2. อัปโหลดไฟล์
.\upload-videos-simple.ps1
```

### วิธีที่ 2: Cloudflare R2 (แนะนำ - ง่ายกว่า)

```powershell
# 1. สร้าง R2 bucket และ API token

# 2. ตั้งค่า credentials
.\server\scripts\setup-r2-env.ps1

# 3. อัปโหลด
cd server
npm install @aws-sdk/client-s3
node scripts/upload-videos-to-r2.js

# 4. อัปเดต URL
node scripts/update-video-urls-to-r2.js
```

## 📋 ไฟล์ที่ต้องอัปโหลด

11 ไฟล์จาก `server/uploads/videos/`:
- video-module_1-1.mp4
- video-module_1-2.mp4
- video-module_2-2.mp4
- store-model-101.mp4
- store-model-101-video2.mp4 ถึง video8.mp4

## ✅ หลังจากอัปโหลดแล้ว

วิดีโอจะทำงานได้ทันที!

