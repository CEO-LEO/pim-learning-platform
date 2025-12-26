# ⚙️ ตั้งค่า Root Directory ใน Railway

## ✅ Deployment กำลังทำงานอยู่

จากภาพที่เห็น:
- Deployment: "Fix Railway deployment: update railway.js..." กำลัง deploy
- Status: "Deployment in progress: Running pre-deploy command..."

**แต่ยังไม่แน่ใจว่าจะสำเร็จหรือไม่** เพราะ Railway อาจจะยังไม่รู้ว่า Root Directory อยู่ที่ไหน

---

## 🔧 ต้องตั้ง Root Directory ใน Railway Settings

แม้ว่าเราได้แก้ไข `railway.json` และ `nixpacks.toml` แล้ว แต่ **Railway อาจจะยังไม่ใช้ Root Directory ที่ถูกต้อง**

### ขั้นตอน:

1. **ไปที่ Railway Dashboard**
2. **เลือก service:** `pim-learning-platform`
3. **ไปที่ Settings tab** (ด้านบน)
4. **หา section:** **Deploy** หรือ **Build & Deploy**
5. **หา field:** **Root Directory**
6. **ตั้งค่าเป็น:** `server`
7. **คลิก Save**

---

## 📋 ตรวจสอบ Settings

### Root Directory
- ✅ ควรเป็น: `server`
- ❌ ไม่ควรเป็น: (ว่าง) หรือ `/` หรือ `./`

### Start Command
- ✅ ควรเป็น: `node index.js` หรือ `npm start`
- ❌ ไม่ควรเป็น: `cd server && node index.js` (ถ้า Root Directory = `server` แล้ว)

---

## ⏳ รอ Deployment เสร็จ

1. **รอให้ deployment เสร็จ** (ประมาณ 2-5 นาที)
2. **ตรวจสอบ Deploy Logs:**
   - ไปที่ **Deploy Logs** tab
   - ดูว่ามี error `Cannot find module '/app/index.js'` หรือไม่
   - ถ้าไม่มี error → สำเร็จ! ✅
   - ถ้ายังมี error → ต้องตั้ง Root Directory

---

## 🧪 ทดสอบหลัง Deployment เสร็จ

### 1. ตรวจสอบ Health Endpoint

เปิด browser ไปที่:
```
https://pim-learning-platform-production.up.railway.app/api/health
```

**ผลลัพธ์:**
- ✅ JSON response → Backend ทำงาน ✅
- ❌ 404 Not Found → Route ไม่ถูกต้อง
- ❌ Connection refused → Backend ยังไม่ online
- ❌ Error → ยังมีปัญหา

---

### 2. ทดสอบ Frontend Login

1. เปิด Frontend: `https://pim-learning-platform.vercel.app/login`
2. ลอง Login ด้วย `STU001` / `student123`
3. ตรวจสอบว่าเชื่อมต่อได้หรือไม่

---

## 📋 Checklist

- [x] แก้ไข railway.json ✅
- [x] เพิ่ม nixpacks.toml ✅
- [x] Push code ไปที่ GitHub ✅
- [ ] ตั้ง Root Directory = `server` ใน Railway Settings
- [ ] รอ deployment เสร็จ
- [ ] ตรวจสอบ Deploy Logs ไม่มี error
- [ ] ทดสอบ `/api/health` endpoint
- [ ] ทดสอบ Frontend Login

---

## 🚨 ถ้า Deployment ยังล้มเหลว

### ตรวจสอบ Deploy Logs:

1. ไปที่ **Deploy Logs** tab
2. ดู error message
3. ถ้ายังเห็น `Cannot find module '/app/index.js'`:
   - **ต้องตั้ง Root Directory = `server` ใน Railway Settings**
   - แล้ว Redeploy

---

## 💡 Tips

- **Root Directory** ใน Railway Settings จะ override `railway.json` และ `nixpacks.toml`
- **แนะนำให้ตั้ง Root Directory ใน Settings** เพื่อให้แน่ใจว่า Railway ใช้ path ที่ถูกต้อง
- หลังจากตั้ง Root Directory แล้ว Railway จะ auto-redeploy

