# 🎥 Railway Git LFS Setup Guide

## ปัญหา
ไฟล์วิดีโอถูกเก็บด้วย Git LFS แต่ Railway อาจจะไม่ pull ไฟล์อัตโนมัติ

## วิธีแก้ไข

### วิธีที่ 1: ตั้งค่า Build Command ใน Railway

1. ไปที่ Railway Dashboard → Project Settings → Service
2. ไปที่ "Settings" → "Build"
3. เพิ่ม Build Command:
```bash
git lfs install && git lfs pull && cd server && npm install && cd ../client && npm install && npm run build
```

### วิธีที่ 2: ใช้ Nixpacks Configuration

สร้างไฟล์ `nixpacks.toml` ใน root directory:

```toml
[phases.setup]
nixPkgs = ["git", "git-lfs"]

[phases.install]
cmds = [
  "git lfs install",
  "git lfs pull",
  "cd server && npm install",
  "cd ../client && npm install"
]

[phases.build]
cmds = ["cd client && npm run build"]
```

### วิธีที่ 3: ใช้ Railway Volume (แนะนำสำหรับไฟล์ขนาดใหญ่)

1. ไปที่ Railway Dashboard → Project → Volumes
2. สร้าง Volume ใหม่
3. Mount volume ไปที่ `/server/uploads/videos`
4. Upload ไฟล์วิดีโอไปยัง Volume

### วิธีที่ 4: ใช้ External Storage (แนะนำที่สุด)

อัปโหลดไฟล์วิดีโอไปยัง:
- **Cloudinary** (ฟรี 25GB)
- **AWS S3** 
- **Google Cloud Storage**
- **Railway Volume**

แล้วอัปเดต video URLs ใน database ให้ชี้ไปยัง external storage

## ตรวจสอบ

หลังจาก deploy แล้ว ตรวจสอบว่าไฟล์วิดีโอมีอยู่หรือไม่:

```bash
# SSH เข้า Railway
railway shell

# ตรวจสอบไฟล์
ls -lh server/uploads/videos/
```

## หมายเหตุ

- Git LFS ต้อง pull files แยกต่างหาก
- Railway อาจจะต้องตั้งค่า Git LFS ใน build process
- สำหรับไฟล์ขนาดใหญ่ (1.2GB) แนะนำให้ใช้ External Storage

