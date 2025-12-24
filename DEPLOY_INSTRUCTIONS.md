# 🚀 คำสั่ง Deploy ทันที

## ✅ สถานะปัจจุบัน
- ✅ Git repository ถูกสร้างแล้ว
- ✅ Build folder พร้อมแล้ว
- ✅ ไฟล์ configuration พร้อมแล้ว

---

## 📋 ขั้นตอนการ Deploy

### Step 1: สร้าง GitHub Repository

1. ไปที่ https://github.com/new
2. สร้าง repository ใหม่ (ชื่ออะไรก็ได้ เช่น `pim-learning-platform`)
3. **อย่า** check "Initialize with README"
4. คัดลอก URL ของ repository (เช่น: `https://github.com/your-username/pim-learning-platform.git`)

---

### Step 2: Push Code ขึ้น GitHub

รันคำสั่งนี้ใน PowerShell (แทนที่ URL ด้วย URL ของคุณ):

```powershell
cd C:\PIMX
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

---

### Step 3: Deploy Backend (Railway)

1. ไปที่ https://railway.app
2. **Login** ด้วย GitHub
3. **New Project** → **Deploy from GitHub repo**
4. เลือก repository ที่เพิ่งสร้าง
5. ตั้งค่า:
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`
6. ไปที่ **Variables** tab → เพิ่ม:
   ```
   PORT=5000
   JWT_SECRET=your_very_secure_secret_key_here_change_this
   DATABASE_URL=sqlite:./database/pim_learning.db
   NODE_ENV=production
   ```
7. รอให้ deploy เสร็จ (2-3 นาที)
8. **คัดลอก URL** ที่ Railway ให้ (เช่น: `https://xxx.railway.app`)

---

### Step 4: Deploy Frontend (Vercel)

1. ไปที่ https://vercel.com
2. **Login** ด้วย GitHub
3. **Add New Project**
4. **Import Git Repository** → เลือก repository ของคุณ
5. ตั้งค่า:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. **Environment Variables**:
   - คลิก **Environment Variables**
   - เพิ่ม:
     - **Name**: `REACT_APP_API_URL`
     - **Value**: `https://xxx.railway.app/api` (URL จาก Step 3)
     - **Environment**: เลือก Production, Preview, Development
7. **Click Deploy**
8. รอให้ deploy เสร็จ (3-5 นาที)

---

### Step 5: ตั้งค่า CORS

หลังจากได้ Vercel URL แล้ว:

1. กลับไปที่ **Railway Dashboard**
2. ไปที่ **Variables** tab
3. เพิ่ม:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
4. Railway จะ auto-redeploy

---

## ✅ เสร็จแล้ว!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://xxx.railway.app`

---

## 🧪 ทดสอบ

1. เปิด Frontend URL
2. Login ด้วย `STU001` / `student123`
3. ทดสอบฟีเจอร์ต่างๆ

---

## 🔄 Auto Deploy

หลังจากนี้:
- **Push code ไปที่ `main` branch** → Vercel และ Railway จะ auto-deploy อัตโนมัติ!

---

## 💡 Tips

- ✅ ใช้ Custom Domain ใน Vercel (ฟรี)
- ✅ ตั้งค่า Environment Variables ให้ครบ
- ✅ Backup database เป็นประจำ

