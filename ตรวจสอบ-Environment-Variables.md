# ✅ ตรวจสอบ Environment Variables

## 📋 สถานะปัจจุบัน

### ✅ Railway (Backend)
- ✅ Service status = **"Online"**
- ✅ `ALLOWED_ORIGINS` ตั้งแล้ว: `https://pim-learning-platform.vercel.app,https://pim-learning-platform-dxu6jq6m8-leos-projects-6776feba.vercel.app`
- ✅ Environment Variables อื่นๆ ครบแล้ว

### ⚠️ Vercel (Frontend)
- ⚠️ `REACT_APP_API_URL` มีอยู่แล้ว แต่ต้องตรวจสอบค่า

---

## 🔍 ตรวจสอบ `REACT_APP_API_URL` ใน Vercel

### Step 1: ตรวจสอบค่า

1. ไปที่ **Vercel Dashboard** → **Settings** → **Environment Variables**
2. คลิกที่ `REACT_APP_API_URL` (หรือคลิก 3 dots → Edit)
3. ตรวจสอบว่า Value = `https://pim-learning-platform-production.up.railway.app/api`
   - ⚠️ **สำคัญ**: ต้องมี `/api` ต่อท้าย!
   - ⚠️ ต้องเป็น `https://` (ไม่ใช่ `http://`)

---

### Step 2: แก้ไข (ถ้าค่าไม่ถูกต้อง)

1. คลิกที่ `REACT_APP_API_URL` → **Edit**
2. เปลี่ยน Value เป็น: `https://pim-learning-platform-production.up.railway.app/api`
3. ตรวจสอบว่า **Environment** = **All Environments** (หรือเลือกทั้ง 3 อัน)
4. **Save**

---

### Step 3: Redeploy Frontend

1. ไปที่ **Deployments** tab
2. คลิก **...** (three dots) → **Redeploy**
3. รอให้เสร็จ (ประมาณ 2-3 นาที)

---

## ✅ Checklist

- [x] `ALLOWED_ORIGINS` ใน Railway ตั้งแล้ว
- [ ] `REACT_APP_API_URL` ใน Vercel = `https://pim-learning-platform-production.up.railway.app/api`
- [ ] Value มี `/api` ต่อท้าย
- [ ] Environment = All Environments
- [ ] Redeploy Frontend แล้ว
- [ ] ทดสอบ Login แล้ว

---

## 🧪 ทดสอบหลัง Redeploy

1. เปิด: `https://pim-learning-platform-dxu6jq6m8-leos-projects-6776feba.vercel.app/login`
2. เปิด **Developer Tools** (F12)
3. ไปที่ **Console** tab
4. ใส่รหัส: `STU001`
5. ใส่รหัสผ่าน: `student123`
6. คลิก "เข้าสู่ระบบ"
7. ตรวจสอบว่า:
   - ✅ ไม่มี error "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"
   - ✅ ไม่มี CORS error ใน Console
   - ✅ Login สำเร็จ

---

## 🔍 ตรวจสอบ Network Requests

1. เปิด **Developer Tools** (F12)
2. ไปที่ **Network** tab
3. ลอง Login
4. ดู request ไปที่ `/api/auth/login`
5. ตรวจสอบว่า:
   - ✅ Request URL = `https://pim-learning-platform-production.up.railway.app/api/auth/login`
   - ✅ Status = 200 (สำเร็จ)
   - ❌ Status = CORS error → ตรวจสอบ `ALLOWED_ORIGINS` ใน Railway
   - ❌ Status = 404 → ตรวจสอบ `REACT_APP_API_URL` ใน Vercel

---

## 💡 Tips

- ✅ Backend URL: `https://pim-learning-platform-production.up.railway.app`
- ✅ API Base URL: `https://pim-learning-platform-production.up.railway.app/api`
- ✅ ต้องมี `/api` ต่อท้ายใน `REACT_APP_API_URL`
- ✅ หลังแก้ Environment Variables แล้วต้อง Redeploy Frontend
- ✅ ใช้ Developer Tools เพื่อ debug

---

## 🚨 Troubleshooting

### Error: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"

**สาเหตุที่เป็นไปได้:**
1. `REACT_APP_API_URL` ไม่ถูกต้อง หรือไม่มี `/api`
2. Frontend ยังไม่ได้ Redeploy หลังแก้ Environment Variables
3. Backend ยังไม่ Online

**วิธีแก้:**
1. ตรวจสอบ `REACT_APP_API_URL` ใน Vercel
2. Redeploy Frontend
3. ตรวจสอบ Backend status ใน Railway

---

### Error: CORS policy blocked

**สาเหตุ:**
- `ALLOWED_ORIGINS` ไม่มี Vercel domain ที่ใช้

**วิธีแก้:**
1. ไปที่ Railway → Variables
2. เพิ่ม Vercel domain ใน `ALLOWED_ORIGINS`
3. Railway จะ auto-redeploy


