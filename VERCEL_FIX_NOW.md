# ⚡ แก้ไข Vercel ทันที - Step by Step

## 🎯 ปัญหา: หน้า login ที่แสดงไม่ใช่ของ PIM Learning Platform

---

## ✅ วิธีแก้ไข (ทำตามลำดับ)

### Step 1: ตรวจสอบ Vercel Project

1. ไปที่ https://vercel.com
2. Login และเลือก Project ของคุณ
3. ไปที่ **Settings** → **General**

### Step 2: ตั้งค่า Root Directory (สำคัญที่สุด!)

1. หา **Root Directory** ใน Settings
2. เปลี่ยนจาก (ว่างเปล่า) หรือ `/` เป็น: **`client`**
3. **Save**

### Step 3: ตรวจสอบ Build Settings

1. ใน **Settings** → **General**
2. ตรวจสอบ:
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 4: ตั้งค่า Environment Variables

1. ไปที่ **Settings** → **Environment Variables**
2. เพิ่ม:
   ```
   Name: REACT_APP_API_URL
   Value: https://your-backend.railway.app/api
   Environment: Production, Preview, Development (เลือกทั้งหมด)
   ```
3. **Save**

### Step 5: Redeploy

1. ไปที่ **Deployments** tab
2. คลิก **...** (three dots) บน deployment ล่าสุด
3. เลือก **Redeploy**

---

## 🚀 หรือ Deploy ใหม่ทั้งหมด

### วิธีที่เร็วที่สุด:

1. **ลบ Project เดิม** (Settings → Delete Project)
2. **สร้างใหม่**:
   - Import Git Repository
   - **Root Directory**: `client` ⚠️ **สำคัญมาก!**
   - Framework: Create React App
   - Build: `npm run build`
   - Output: `build`
   - Environment: `REACT_APP_API_URL=https://your-backend.railway.app/api`
3. **Deploy**

---

## ✅ หลังแก้ไข ควรเห็น:

- หน้า Login ของ PIM Learning Platform
- มีโลโก้ PIM
- มีฟิลด์ "รหัสนิสิต" และ "รหัสผ่าน"
- มีปุ่ม "เข้าสู่ระบบ"

---

## 🔍 ตรวจสอบ

1. เปิด Vercel URL
2. ดูหน้า source (Ctrl+U)
3. ควรเห็น `<title>PIM Learning Platform</title>`
4. ไม่ควรเห็น "YourApp" หรือ "CRUD"

---

## 📞 ถ้ายังไม่ได้

1. ตรวจสอบ **Deployments** → ดู **Build Logs**
2. ตรวจสอบว่า code ถูก push ขึ้น GitHub แล้ว
3. ตรวจสอบว่า `client/` folder มีไฟล์ครบ

