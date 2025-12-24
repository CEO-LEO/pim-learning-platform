# 🚀 คู่มือ Deploy ขึ้น Vercel

## 📋 โครงสร้างการ Deploy

- **Frontend (React)**: Deploy บน Vercel ✅
- **Backend (Express)**: Deploy บน Railway/Render (แนะนำ) หรือ VPS

---

## 🎯 ขั้นตอนที่ 1: Deploy Backend ก่อน

### วิธีที่ 1: Railway (แนะนำ - ง่ายที่สุด)

1. ไปที่ [railway.app](https://railway.app)
2. สร้าง Account และ New Project
3. เลือก "Deploy from GitHub repo"
4. เลือก repository ของคุณ
5. ตั้งค่า:
   - **Root Directory**: `server`
   - **Build Command**: (ไม่ต้องใส่ - Railway จะรัน `npm install` อัตโนมัติ)
   - **Start Command**: `node index.js`

6. ตั้งค่า Environment Variables:
   ```
   PORT=5000
   JWT_SECRET=your_very_secure_secret_key_here
   DATABASE_URL=sqlite:./database/pim_learning.db
   NODE_ENV=production
   ```

7. Railway จะให้ URL เช่น: `https://your-app.railway.app`
8. **บันทึก URL นี้ไว้** - จะใช้สำหรับ Frontend

---

### วิธีที่ 2: Render

1. ไปที่ [render.com](https://render.com)
2. สร้าง Account และ New Web Service
3. Connect GitHub repository
4. ตั้งค่า:
   - **Name**: `pim-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

5. ตั้งค่า Environment Variables (เหมือน Railway)
6. Render จะให้ URL เช่น: `https://pim-backend.onrender.com`

---

## 🎯 ขั้นตอนที่ 2: Deploy Frontend บน Vercel

### วิธีที่ 1: ใช้ Vercel CLI (แนะนำ)

```bash
# 1. ติดตั้ง Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. ไปที่ client directory
cd client

# 4. Deploy
vercel

# 5. ตอบคำถาม:
# - Set up and deploy? Y
# - Which scope? (เลือก account)
# - Link to existing project? N
# - Project name? pim-learning-frontend
# - Directory? ./
# - Override settings? N

# 6. ตั้งค่า Environment Variables
vercel env add REACT_APP_API_URL
# ใส่ค่า: https://your-backend-url.railway.app/api
# (ใช้ URL จาก Railway/Render ที่ได้ในขั้นตอนที่ 1)

# 7. Deploy Production
vercel --prod
```

---

### วิธีที่ 2: ใช้ Vercel Dashboard

1. ไปที่ [vercel.com](https://vercel.com)
2. สร้าง Account และ New Project
3. Import Git Repository
4. ตั้งค่า Project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

5. ตั้งค่า Environment Variables:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.railway.app/api`
   - **Environment**: Production, Preview, Development

6. Click "Deploy"

---

## 📝 สร้างไฟล์ vercel.json

สร้างไฟล์ `client/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## ⚙️ ตั้งค่า Environment Variables

### บน Vercel (Frontend):
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

### บน Railway/Render (Backend):
```
PORT=5000
JWT_SECRET=your_very_secure_secret_key_here
DATABASE_URL=sqlite:./database/pim_learning.db
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

---

## 🔧 แก้ไข CORS ใน Backend

แก้ไข `server/index.js` ให้รองรับ Vercel domain:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.ALLOWED_ORIGINS?.split(',') || [],
        'https://your-app.vercel.app',
        /\.vercel\.app$/
      ].flat()
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
```

---

## ✅ Checklist

- [ ] Deploy Backend บน Railway/Render สำเร็จ
- [ ] ได้ Backend URL แล้ว
- [ ] ตั้งค่า Environment Variables ใน Backend
- [ ] ตั้งค่า CORS ให้รองรับ Vercel domain
- [ ] สร้างไฟล์ `client/vercel.json`
- [ ] Deploy Frontend บน Vercel
- [ ] ตั้งค่า `REACT_APP_API_URL` ใน Vercel
- [ ] ทดสอบ Login
- [ ] ทดสอบ API calls

---

## 🧪 ทดสอบหลัง Deploy

1. **Frontend URL**: `https://your-app.vercel.app`
2. **Backend URL**: `https://your-backend.railway.app`
3. **Health Check**: `https://your-backend.railway.app/api/health`
4. **ทดสอบ Login**: ใช้บัญชี `STU001` / `student123`

---

## 🔄 Auto Deploy

Vercel จะ auto-deploy เมื่อ:
- Push code ไปที่ `main` branch (Production)
- Push code ไปที่ branch อื่น (Preview)

---

## 📞 Troubleshooting

### Frontend ไม่เชื่อมต่อกับ Backend
- ตรวจสอบ `REACT_APP_API_URL` ใน Vercel
- ตรวจสอบ CORS settings ใน Backend
- ตรวจสอบ Network tab ใน Browser DevTools

### CORS Error
- เพิ่ม Vercel domain ใน `ALLOWED_ORIGINS`
- ตรวจสอบ CORS configuration ใน `server/index.js`

---

## 💡 Tips

1. **ใช้ Custom Domain**: ตั้งค่า custom domain ใน Vercel
2. **Environment Variables**: ตั้งค่าทั้ง Production และ Preview
3. **Monitoring**: ใช้ Vercel Analytics
4. **Backup**: Backup database เป็นประจำ

---

**อัพเดทล่าสุด:** 24 ธันวาคม 2568

