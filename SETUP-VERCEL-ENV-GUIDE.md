# 🔧 ตั้งค่า Vercel Environment Variables

## ⚡ วิธีที่ 1: ใช้ Vercel Dashboard (แนะนำ - ง่ายที่สุด)

### Step 1: ไปที่ Vercel Dashboard
1. เปิด: https://vercel.com/dashboard
2. Login (ถ้ายังไม่ login)

### Step 2: เลือกโปรเจ็กต์
1. คลิกโปรเจ็กต์: **pim-learning-platform**

### Step 3: ไปที่ Settings
1. คลิก **Settings** (เมนูด้านบน)
2. คลิก **Environment Variables** (เมนูด้านซ้าย)

### Step 4: เพิ่ม Environment Variable
1. คลิก **Add New**
2. **Key:** `REACT_APP_API_URL`
3. **Value:** `https://[YOUR_RAILWAY_URL]/api`
   - ตัวอย่าง: `https://pim-learning-platform-production.up.railway.app/api`
4. **Environment:** เลือกทั้ง 3 ตัว:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development (ใส่: `http://localhost:5000/api`)
5. คลิก **Save**

### Step 5: Redeploy
1. ไปที่ **Deployments** (เมนูด้านบน)
2. คลิก **3 dots (...)** บน deployment ล่าสุด
3. เลือก **Redeploy**
4. รอ 2-3 นาที
5. Refresh หน้าเว็บ (Ctrl+F5)

---

## ⚡ วิธีที่ 2: ใช้ Vercel CLI

### Step 1: Login Vercel CLI
```powershell
vercel login
```

### Step 2: ตั้งค่า Environment Variables
```powershell
# Production
vercel env add REACT_APP_API_URL production
# (ใส่ค่า: https://[YOUR_RAILWAY_URL]/api)

# Preview
vercel env add REACT_APP_API_URL preview
# (ใส่ค่า: https://[YOUR_RAILWAY_URL]/api)

# Development
vercel env add REACT_APP_API_URL development
# (ใส่ค่า: http://localhost:5000/api)
```

### Step 3: Redeploy
```powershell
vercel --prod
```

---

## 🔍 วิธีหา Railway URL

1. ไปที่: https://railway.app/dashboard
2. เลือกโปรเจ็กต์ backend
3. ไปที่ **Settings** → **Domains**
4. Copy **Default Domain** หรือ **Custom Domain**

---

## ✅ ตรวจสอบ

หลังจาก redeploy แล้ว:

1. เปิด Developer Tools (F12)
2. ไปที่ Console tab
3. ดู log: `[VideoPlayer] Constructed URL:`
4. ตรวจสอบว่า URL ถูกต้องหรือไม่

---

## 🐛 Troubleshooting

### วิดีโอยังไม่ขึ้น

1. **ตรวจสอบ Console:**
   - เปิด F12 → Console
   - ดู error messages
   - ตรวจสอบว่า API URL ถูกต้องหรือไม่

2. **ตรวจสอบ Network:**
   - เปิด F12 → Network
   - ลองเปิดวิดีโอ
   - ดู request ไปที่ `/api/videos/[videoId]`
   - ตรวจสอบ status code (ควรเป็น 200)

3. **ตรวจสอบ CORS:**
   - ดู error: `CORS policy: No 'Access-Control-Allow-Origin'`
   - ไปที่ Railway → Settings → Environment Variables
   - เพิ่ม `ALLOWED_ORIGINS` = `https://pim-learning-platform.vercel.app`

4. **ตรวจสอบ Railway:**
   - ดู Railway logs
   - ตรวจสอบว่า server รันอยู่หรือไม่
   - ตรวจสอบว่า Git LFS files ถูก pull แล้วหรือไม่

---

## 📝 หมายเหตุ

- Environment variables จะถูก inject ใน build time
- ต้อง redeploy หลังจากเพิ่ม/แก้ไข environment variables
- ใช้ `REACT_APP_` prefix สำหรับ React environment variables

