# 🔄 Redeploy Frontend ใน Vercel

## ✅ Environment Variable ตั้งค่าแล้ว

- `REACT_APP_API_URL` = `https://pim-learning-platform-production.up.railway.app/api` ✅
- Environment = All Environments ✅

---

## 🔄 ขั้นตอน Redeploy

### วิธีที่ 1: Redeploy จาก Vercel Dashboard (แนะนำ)

1. ไปที่ **Deployments** tab (ด้านบน)
2. หา deployment ล่าสุด (ที่ build สำเร็จ)
3. คลิก **...** (สามจุด) ที่มุมขวาบนของ deployment card
4. เลือก **Redeploy**
5. เลือก **Use existing Build Cache** (ไม่ต้องเลือกก็ได้)
6. คลิก **Redeploy**

**รอให้ build เสร็จ** (ประมาณ 1-2 นาที)

---

### วิธีที่ 2: Push Code ใหม่ (Auto-deploy)

1. แก้ไขไฟล์เล็กน้อย (เช่น เพิ่ม comment)
2. Commit และ Push ไปที่ GitHub
3. Vercel จะ auto-deploy

---

## 🧪 ทดสอบหลัง Redeploy

1. รอให้ deployment เสร็จ (status = Ready)
2. เปิด Frontend URL: `https://pim-learning-platform.vercel.app/login`
3. ลอง Login ด้วย `STU001` / `student123`
4. ตรวจสอบว่าเชื่อมต่อได้หรือไม่

---

## 🐛 ถ้ายังไม่ได้

### ตรวจสอบ Browser Console:

1. กด **F12** เปิด Developer Tools
2. ไปที่ **Console** tab
3. ลอง Login
4. ดู error message

### ตรวจสอบ Network:

1. ไปที่ **Network** tab
2. ลอง Login
3. ดู request ไปที่ `/api/auth/login`
4. ตรวจสอบ:
   - Request URL = `https://pim-learning-platform-production.up.railway.app/api/auth/login`?
   - Status code = ?

---

## 📋 Checklist

- [ ] Environment Variable ตั้งค่าแล้ว ✅
- [ ] Frontend ได้ Redeploy แล้ว
- [ ] Deployment status = Ready
- [ ] ทดสอบ Login แล้ว
- [ ] ตรวจสอบ Browser Console (ถ้ายังไม่ได้)

