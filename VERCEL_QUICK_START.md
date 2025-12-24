# ⚡ Vercel Quick Start

## 🚀 Deploy ใน 5 นาที

### Step 1: Deploy Backend (Railway) - 2 นาที

1. ไปที่ https://railway.app
2. Login with GitHub
3. New Project → Deploy from GitHub repo
4. เลือก repository
5. ตั้งค่า:
   - **Root Directory**: `server`
6. ตั้งค่า Environment Variables:
   ```
   PORT=5000
   JWT_SECRET=your_secret_key_here
   DATABASE_URL=sqlite:./database/pim_learning.db
   ```
7. **คัดลอก URL** ที่ Railway ให้ (เช่น: `https://xxx.railway.app`)

---

### Step 2: Deploy Frontend (Vercel) - 3 นาที

#### วิธี A: ใช้ Vercel Dashboard (ง่ายที่สุด)

1. ไปที่ https://vercel.com
2. Login with GitHub
3. Add New Project
4. Import Git Repository
5. ตั้งค่า:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Environment Variables:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://xxx.railway.app/api` (URL จาก Step 1)
7. Click **Deploy**

#### วิธี B: ใช้ Vercel CLI

```bash
cd client
npm install -g vercel
vercel login
vercel
# ตอบคำถามตามที่ถาม
vercel env add REACT_APP_API_URL
# ใส่: https://xxx.railway.app/api
vercel --prod
```

---

### Step 3: ตั้งค่า CORS

แก้ไข `server/index.js` หรือตั้งค่าใน Railway:
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## ✅ เสร็จแล้ว!

- Frontend: `https://your-app.vercel.app`
- Backend: `https://xxx.railway.app`

---

## 🔄 Auto Deploy

- **Vercel**: Auto-deploy เมื่อ push ไปที่ `main` branch
- **Railway**: Auto-deploy เมื่อ push ไปที่ `main` branch

---

## 📝 หมายเหตุ

- Vercel ฟรีสำหรับ Personal projects
- Railway ให้ $5 credit ฟรีต่อเดือน
- Database (SQLite) จะถูกเก็บใน Railway volume

