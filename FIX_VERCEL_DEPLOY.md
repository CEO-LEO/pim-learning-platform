# 🔧 แก้ไขปัญหา Vercel Deploy

## ❌ ปัญหา: หน้า login ที่แสดงไม่ใช่ของ PIM Learning Platform

### สาเหตุที่เป็นไปได้:
1. **Root Directory ไม่ถูกต้อง** - Vercel อาจ deploy จาก root แทนที่จะเป็น `client`
2. **Build Command ไม่ถูกต้อง**
3. **Environment Variables ยังไม่ได้ตั้งค่า**

---

## ✅ วิธีแก้ไข

### Step 1: ตรวจสอบ Vercel Project Settings

1. ไปที่ **Vercel Dashboard** → เลือก Project ของคุณ
2. ไปที่ **Settings** → **General**
3. ตรวจสอบ:
   - **Root Directory**: ต้องเป็น `client` (ไม่ใช่ root)
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 2: ตั้งค่า Root Directory

1. ใน Vercel Dashboard → **Settings** → **General**
2. **Root Directory**: เปลี่ยนเป็น `client`
3. **Save**

### Step 3: ตั้งค่า Environment Variables

1. ไปที่ **Settings** → **Environment Variables**
2. เพิ่ม:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api`
   - **Environment**: เลือก Production, Preview, Development ทั้งหมด
3. **Save**

### Step 4: Redeploy

1. ไปที่ **Deployments** tab
2. คลิก **...** (three dots) บน deployment ล่าสุด
3. เลือก **Redeploy**
4. หรือ **Settings** → **General** → **Redeploy**

---

## 🚀 Deploy ใหม่ทั้งหมด (แนะนำ)

### วิธีที่ 1: ลบ Project แล้วสร้างใหม่

1. ไปที่ Vercel Dashboard
2. **Settings** → **General** → **Delete Project**
3. สร้าง Project ใหม่:
   - **Import Git Repository**
   - **Root Directory**: `client` ⚠️ **สำคัญ!**
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**: `REACT_APP_API_URL=https://your-backend.railway.app/api`

### วิธีที่ 2: ใช้ Vercel CLI

```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm install -g vercel

# Login
vercel login

# ไปที่ client directory
cd client

# Deploy (จะถาม Root Directory - ตอบว่า . หรือ ./)
vercel

# ตั้งค่า Environment Variable
vercel env add REACT_APP_API_URL
# Production: https://your-backend.railway.app/api
# Preview: https://your-backend.railway.app/api
# Development: https://your-backend.railway.app/api

# Deploy Production
vercel --prod
```

---

## ✅ Checklist

- [ ] Root Directory ตั้งเป็น `client`
- [ ] Framework Preset เป็น `Create React App`
- [ ] Build Command เป็น `npm run build`
- [ ] Output Directory เป็น `build`
- [ ] Environment Variable `REACT_APP_API_URL` ตั้งค่าแล้ว
- [ ] Backend URL ถูกต้อง
- [ ] Redeploy แล้ว

---

## 🧪 ทดสอบหลังแก้ไข

1. เปิด Vercel URL
2. ควรเห็นหน้า Login ของ PIM Learning Platform (มีโลโก้ PIM, ฟิลด์รหัสนิสิต, รหัสผ่าน)
3. ทดสอบ Login ด้วย `STU001` / `student123`

---

## 📞 ถ้ายังไม่ได้

1. ตรวจสอบ **Deployments** tab → ดู logs
2. ตรวจสอบว่า code ถูก push ขึ้น GitHub แล้ว
3. ตรวจสอบว่า `client/package.json` มี build script
4. ตรวจสอบว่า `client/vercel.json` มีอยู่

