# 🚀 วิธีแก้ไข LFS Pointer บน Railway

## วิธีที่ 1: ใช้ Railway Volumes (แนะนำ)

### ขั้นตอน:

1. **สร้าง Volume ใน Railway Dashboard:**
   - ไปที่ Railway Dashboard → Project → Volumes
   - คลิก "New Volume"
   - ชื่อ: `video-storage`
   - ขนาด: 5-10GB (ตามขนาดไฟล์วิดีโอ)
   - Mount path: `/app/server/uploads/videos`

2. **อัปโหลดไฟล์วิดีโอ:**
   
   **วิธี A: ใช้ Railway Dashboard (ง่ายที่สุด)**
   - ไปที่ Volume → Upload Files
   - เลือกไฟล์วิดีโอทั้งหมดจาก `server/uploads/videos/`
   - อัปโหลด

   **วิธี B: ใช้ Railway CLI**
   ```bash
   # ติดตั้ง Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Link project
   railway link
   
   # Mount volume locally
   railway volume mount
   # จะได้ path เช่น: /tmp/railway-volume-xxxxx
   
   # Copy ไฟล์
   cp -r server/uploads/videos/* /tmp/railway-volume-xxxxx/
   ```

3. **ตรวจสอบ:**
   ```bash
   railway shell
   ls -lh /app/server/uploads/videos/
   file /app/server/uploads/videos/video-module_1-1.mp4
   ```

---

## วิธีที่ 2: ใช้ External Storage (แนะนำที่สุด)

### Cloudinary (ฟรี 25GB):

1. สร้าง account ที่ https://cloudinary.com
2. อัปโหลดไฟล์วิดีโอ
3. อัปเดต URLs ใน database:
   ```sql
   UPDATE videos 
   SET url = 'https://res.cloudinary.com/your-cloud/video/upload/v1234567890/video-module_1-1.mp4'
   WHERE video_id = '1480c4e4-fec6-4c8b-8ada-9a99c685413e';
   ```

### AWS S3 / Cloudflare R2:

1. สร้าง bucket
2. อัปโหลดไฟล์
3. อัปเดต URLs ใน database

---

## วิธีที่ 3: แก้ไข Build Process

แก้ไข `nixpacks.toml` เพื่อ pull Git LFS files:

```toml
[phases.setup]
nixPkgs = ["git", "git-lfs", "nodejs-18_x"]

[phases.install]
cmds = [
  "git lfs install",
  "git lfs pull --all || echo 'LFS pull failed, continuing...'",
  # ... rest of commands
]
```

**หมายเหตุ:** วิธีนี้อาจไม่ทำงานถ้า Railway ไม่ support Git LFS authentication

---

## ✅ Checklist

- [ ] ตรวจสอบว่าไฟล์เป็น LFS pointer (รัน `node server/scripts/check-video-files.js`)
- [ ] เลือกวิธีแก้ไข (Volume / External Storage)
- [ ] อัปโหลดไฟล์วิดีโอจริง
- [ ] ตรวจสอบว่าไฟล์มีอยู่บน server
- [ ] ทดสอบวิดีโอในแอปพลิเคชัน
- [ ] ตรวจสอบ `/api/health` endpoint

---

## 🔍 ตรวจสอบปัญหา

```bash
# Local
node server/scripts/check-video-files.js

# On Railway
railway shell
cd /app/server/uploads/videos
file video-module_1-1.mp4
head -5 video-module_1-1.mp4
```

---

## 📞 ต้องการความช่วยเหลือ?

1. ตรวจสอบ Railway build logs
2. ตรวจสอบ `/api/health` endpoint
3. ดู console logs ใน browser (F12)
4. ตรวจสอบ Network tab ใน browser DevTools

