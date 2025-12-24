# 🚀 Deploy ทันที - Step by Step

## ⚡ ขั้นตอนการ Deploy

### Step 1: Deploy Backend (Railway) - ต้องทำก่อน!

1. **เปิดเบราว์เซอร์ไปที่**: https://railway.app
2. **Login** ด้วย GitHub account
3. **New Project** → **Deploy from GitHub repo**
4. **เลือก repository** ของคุณ (ถ้ายังไม่มี ให้ push code ขึ้น GitHub ก่อน)
5. **ตั้งค่า**:
   - **Root Directory**: `server`
   - **Build Command**: (เว้นว่างไว้)
   - **Start Command**: `node index.js`
6. **Environment Variables** (คลิก Variables tab):
   ```
   PORT=5000
   JWT_SECRET=your_very_secure_secret_key_change_this
   DATABASE_URL=sqlite:./database/pim_learning.db
   NODE_ENV=production
   ```
7. **รอให้ Deploy เสร็จ** (ประมาณ 2-3 นาที)
8. **คัดลอก URL** ที่ Railway ให้ (เช่น: `https://pim-backend-production.up.railway.app`)

---

### Step 2: Deploy Frontend (Vercel)

#### วิธีที่ 1: ใช้ Vercel Dashboard (แนะนำ)

1. **เปิดเบราว์เซอร์ไปที่**: https://vercel.com
2. **Login** ด้วย GitHub account
3. **Add New Project**
4. **Import Git Repository** → เลือก repository ของคุณ
5. **ตั้งค่า Project**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. **Environment Variables**:
   - คลิก **Environment Variables**
   - เพิ่ม:
     - **Name**: `REACT_APP_API_URL`
     - **Value**: `https://xxx.railway.app/api` (ใส่ URL จาก Step 1)
     - **Environment**: เลือก Production, Preview, Development ทั้งหมด
7. **Click Deploy**
8. **รอให้ Deploy เสร็จ** (ประมาณ 3-5 นาที)

---

#### วิธีที่ 2: ใช้ Vercel CLI

```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm install -g vercel

# Login
vercel login

# ไปที่ client directory
cd client

# Deploy
vercel

# ตอบคำถาม:
# - Set up and deploy? Y
# - Which scope? (เลือก account)
# - Link to existing project? N
# - Project name? pim-learning-frontend
# - Directory? ./
# - Override settings? N

# ตั้งค่า Environment Variable
vercel env add REACT_APP_API_URL
# Production: https://xxx.railway.app/api
# Preview: https://xxx.railway.app/api
# Development: https://xxx.railway.app/api

# Deploy Production
vercel --prod
```

---

### Step 3: ตั้งค่า CORS

หลังจากได้ Vercel URL แล้ว:

1. กลับไปที่ **Railway Dashboard**
2. ไปที่ **Variables** tab
3. เพิ่ม Environment Variable:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. **Redeploy** service (Railway จะ auto-redeploy)

---

## ✅ ตรวจสอบหลัง Deploy

1. **Frontend**: เปิด `https://your-app.vercel.app`
2. **Backend**: เปิด `https://xxx.railway.app`
3. **Health Check**: `https://xxx.railway.app/api/health`
4. **ทดสอบ Login**: ใช้ `STU001` / `student123`

---

## 🔄 Auto Deploy

- **Vercel**: จะ auto-deploy เมื่อ push code ไปที่ `main` branch
- **Railway**: จะ auto-deploy เมื่อ push code ไปที่ `main` branch

---

## 📝 หมายเหตุ

- ✅ Vercel ฟรีสำหรับ Personal projects
- ✅ Railway ให้ $5 credit ฟรีต่อเดือน
- ✅ Database จะถูกเก็บใน Railway volume
- ✅ ต้องมี GitHub repository ก่อน

---

## 🆘 ถ้ายังไม่มี GitHub Repository

```bash
# สร้าง Git repository
cd C:\PIMX
git init
git add .
git commit -m "Initial commit"
git branch -M main

# สร้าง repository บน GitHub แล้ว:
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

