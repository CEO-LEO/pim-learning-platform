# 🔧 แก้ไขปัญหา Git LFS Pointer Files

## ❌ ปัญหา
ไฟล์วิดีโอบน Railway เป็น LFS pointer files (ไฟล์เล็กๆ ที่ชี้ไปยังไฟล์จริง) แทนที่จะเป็นไฟล์วิดีโอจริง ทำให้วิดีโอไม่สามารถเล่นได้

## ✅ วิธีแก้ไข (เลือก 1 วิธี)

### วิธีที่ 1: ใช้ Railway Volumes (แนะนำสำหรับไฟล์ขนาดใหญ่)

#### ขั้นตอนที่ 1: สร้าง Volume ใน Railway
1. ไปที่ Railway Dashboard → Project → Volumes
2. คลิก "New Volume"
3. ตั้งชื่อ: `video-storage`
4. ตั้งขนาด: ตามขนาดไฟล์วิดีโอ (เช่น 5GB)
5. Mount path: `/app/server/uploads/videos`

#### ขั้นตอนที่ 2: อัปโหลดไฟล์วิดีโอ
**ใช้ Railway CLI:**
```bash
# ติดตั้ง Railway CLI (ถ้ายังไม่มี)
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# อัปโหลดไฟล์ (ใช้ PowerShell script)
.\server\scripts\upload-to-railway-volume.ps1
```

**หรืออัปโหลดด้วยมือ:**
```bash
# SSH เข้า Railway
railway shell

# สร้าง directory
mkdir -p /app/server/uploads/videos

# ออกจาก shell แล้วอัปโหลดไฟล์
# ใช้ railway run หรือ railway volume mount
```

#### ขั้นตอนที่ 3: ตรวจสอบ
```bash
# SSH เข้า Railway
railway shell

# ตรวจสอบไฟล์
ls -lh /app/server/uploads/videos/
file /app/server/uploads/videos/video-module_1-1.mp4
```

---

### วิธีที่ 2: ใช้ External Storage (แนะนำที่สุด)

#### ตัวเลือกที่แนะนำ:
1. **Cloudinary** (ฟรี 25GB) - https://cloudinary.com
2. **AWS S3** - https://aws.amazon.com/s3
3. **Google Cloud Storage** - https://cloud.google.com/storage
4. **Cloudflare R2** (ฟรี 10GB) - https://www.cloudflare.com/products/r2

#### ขั้นตอน:
1. สร้าง account และ bucket/storage
2. อัปโหลดไฟล์วิดีโอ
3. อัปเดต URLs ใน database:
```sql
UPDATE videos 
SET url = 'https://your-storage.com/videos/video-module_1-1.mp4'
WHERE video_id = '1480c4e4-fec6-4c8b-8ada-9a99c685413e';
```

---

### วิธีที่ 3: แก้ไข Git LFS Pull ใน Build Process

#### แก้ไข `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["git", "git-lfs", "nodejs-18_x"]

[phases.install]
cmds = [
  "git lfs install",
  "git lfs pull --all",
  # ... existing commands
]
```

**หมายเหตุ:** วิธีนี้อาจไม่ทำงานถ้า Railway ไม่ support Git LFS authentication

---

## 🔍 ตรวจสอบปัญหา

### ตรวจสอบว่าไฟล์เป็น LFS pointer หรือไม่:
```bash
# Local
node server/scripts/check-video-files.js

# On Railway
railway shell
cd server/uploads/videos
file video-module_1-1.mp4
head -5 video-module_1-1.mp4
```

### ตรวจสอบผ่าน API:
```bash
curl https://your-app.railway.app/api/health
```

ดูที่ `videoFiles.hasFiles` และ `videoFiles.lfsPointers`

---

## 📋 Checklist

- [ ] ตรวจสอบว่าไฟล์เป็น LFS pointer
- [ ] เลือกวิธีแก้ไข (Volume / External Storage / Fix LFS)
- [ ] อัปโหลดไฟล์วิดีโอจริง
- [ ] ตรวจสอบว่าไฟล์มีอยู่บน server
- [ ] ทดสอบวิดีโอในแอปพลิเคชัน
- [ ] ตรวจสอบ `/api/health` endpoint

---

## 🚀 Quick Fix Script

รันสคริปต์นี้เพื่ออัปโหลดไฟล์ไปยัง Railway Volume:

```powershell
# Windows PowerShell
.\server\scripts\upload-to-railway-volume.ps1
```

```bash
# Linux/Mac
./server/scripts/upload-to-railway-volume.sh
```

---

## 📞 ต้องการความช่วยเหลือ?

ถ้ายังมีปัญหา:
1. ตรวจสอบ Railway build logs
2. ตรวจสอบ `/api/health` endpoint
3. ดู console logs ใน browser (F12)
4. ตรวจสอบ Network tab ใน browser DevTools

