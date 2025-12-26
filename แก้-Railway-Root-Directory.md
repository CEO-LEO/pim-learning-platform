# 🔧 แก้ Error: Cannot find module '/app/index.js'

## ❌ ปัญหา

Railway กำลังหา `/app/index.js` แต่ไฟล์จริงอยู่ที่ `server/index.js`

**Error:**
```
Error: Cannot find module '/app/index.js'
```

---

## ✅ วิธีแก้: ตั้ง Root Directory ใน Railway

### Step 1: ไปที่ Railway Settings

1. ไปที่ **Railway Dashboard**
2. เลือก service: **pim-learning-platform**
3. ไปที่ **Settings** tab
4. หา section: **Deploy**

---

### Step 2: ตั้ง Root Directory

1. หา field: **Root Directory**
2. ตั้งค่าเป็น: `server`
3. คลิก **Save**

---

### Step 3: ตรวจสอบ Start Command

1. ในหน้า Settings เดียวกัน
2. หา field: **Start Command**
3. ตรวจสอบว่า = `node index.js` (ไม่ต้องมี `cd server` เพราะ Root Directory ตั้งเป็น `server` แล้ว)
4. หรือ = `npm start` (ถ้าใช้ npm script)

---

### Step 4: Redeploy

1. หลังจาก Save แล้ว
2. Railway จะ auto-redeploy
3. หรือคลิก **Redeploy** ที่ deployment ล่าสุด

---

## 🔍 ตรวจสอบหลัง Redeploy

### 1. ดู Deploy Logs

1. ไปที่ **Deploy Logs** tab
2. ตรวจสอบว่าไม่มี error `Cannot find module`
3. ควรเห็น: `Server running on port...`

---

### 2. ทดสอบ Health Endpoint

เปิด browser ไปที่:
```
https://pim-learning-platform-production.up.railway.app/api/health
```

**ผลลัพธ์ที่คาดหวัง:**
- ✅ JSON response: `{"status":"ok",...}`
- ❌ 404 Not Found → Route ไม่ถูกต้อง
- ❌ Connection refused → Backend ยังไม่ online

---

## 📋 Checklist

- [ ] ตั้ง Root Directory = `server` ใน Railway Settings
- [ ] ตรวจสอบ Start Command = `node index.js` หรือ `npm start`
- [ ] Save settings
- [ ] Railway auto-redeploy
- [ ] ตรวจสอบ Deploy Logs ไม่มี error
- [ ] ทดสอบ `/api/health` endpoint
- [ ] ทดสอบ Frontend Login

---

## 💡 Tips

- **Root Directory** = `server` → Railway จะทำงานจาก `server/` directory
- **Start Command** = `node index.js` → รันไฟล์ `index.js` ใน `server/` directory
- ไม่ต้องใช้ `cd server` ใน Start Command เพราะ Root Directory ตั้งเป็น `server` แล้ว

---

## 🚨 ถ้ายังไม่ได้

### ตรวจสอบ railway.json

ไฟล์ `railway.json` ควรมี:
```json
{
  "deploy": {
    "startCommand": "node index.js"
  }
}
```

**หมายเหตุ:** ถ้า Root Directory = `server` แล้ว ไม่ต้องมี `cd server` ใน startCommand

---

## 📸 Screenshot ที่ต้องการ

ถ้ายังไม่ได้ ให้ส่ง screenshot ของ:
1. Railway Settings → Deploy section
2. Root Directory value
3. Start Command value

