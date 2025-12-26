# 🔧 แก้ Error: Cannot find module '/app/index.js'

## ❌ ปัญหา

Backend service ใน Railway **Crashed** เพราะหาไฟล์ `/app/index.js` ไม่เจอ

**Error:**
```
Error: Cannot find module '/app/index.js'
```

**สาเหตุ:**
- Railway กำลังหาไฟล์ที่ `/app/index.js`
- แต่ไฟล์จริงอยู่ที่ `server/index.js`
- Root Directory ใน Railway ยังตั้งผิด

---

## ✅ วิธีแก้ไข (เลือก 1 วิธี)

### วิธีที่ 1: ตั้ง Root Directory (แนะนำ)

1. ไปที่ **Railway Dashboard**
2. เลือก service **"pim-learning-platform"**
3. ไปที่ **Settings** tab
4. หา **"Root Directory"**
5. เปลี่ยนจาก (ว่างเปล่า) → เป็น `server`
6. **Save**
7. Railway จะ auto-redeploy

---

### วิธีที่ 2: เปลี่ยน Start Command

1. ไปที่ **Railway Dashboard**
2. เลือก service **"pim-learning-platform"**
3. ไปที่ **Settings** tab
4. หา **"Start Command"**
5. เปลี่ยนจาก `node index.js` → เป็น `cd server && node index.js`
6. **Save**
7. Railway จะ auto-redeploy

---

## ✅ ตรวจสอบหลังแก้ไข

1. ไปที่ **Deploy Logs** tab
2. ตรวจสอบว่า:
   - ✅ Build สำเร็จแล้ว
   - ✅ Start Command ทำงานได้
   - ✅ Service status = **"Running"** (จุดเขียว)
   - ✅ ไม่มี error `Cannot find module`

---

## 📋 Checklist

- [ ] ตั้ง Root Directory = `server` หรือ Start Command = `cd server && node index.js`
- [ ] Save แล้ว
- [ ] Railway auto-redeploy แล้ว
- [ ] Service status = **"Running"** (จุดเขียว)
- [ ] ไม่มี error ใน Deploy Logs
- [ ] ทดสอบ API endpoint แล้ว

---

## 🧪 ทดสอบหลังแก้ไข

1. ไปที่ **Settings** → **Networking**
2. คัดลอก **Public Domain** (เช่น: `pim-learning-platform-production.up.railway.app`)
3. เปิด browser ไปที่: `https://[YOUR_DOMAIN]/api/health`
4. ควรเห็น response (ถ้ามี health endpoint)

---

## 💡 Tips

- ✅ วิธีที่ 1 (Root Directory) **แนะนำ** เพราะง่ายกว่า
- ✅ หลังแก้แล้ว Railway จะ auto-redeploy
- ✅ รอประมาณ 2-3 นาที
- ✅ ตรวจสอบ Deploy Logs ว่าไม่มี error

