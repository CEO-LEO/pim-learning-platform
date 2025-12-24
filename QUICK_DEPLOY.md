# ⚡ Quick Deploy Guide

## 🎯 วิธีที่เร็วที่สุด: Docker

### 1. เตรียมไฟล์

```bash
# ตั้งค่า environment variables
cp .env.example .env
```

แก้ไข `.env`:
```
JWT_SECRET=your_very_secure_secret_key_here
REACT_APP_API_URL=http://your-domain.com:5000/api
```

### 2. Deploy

```bash
# Build และ Run
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### 3. ตรวจสอบ

- Frontend: http://your-domain.com
- Backend: http://your-domain.com:5000

---

## 🖥️ วิธี VPS (Production)

### 1. Build Frontend

```bash
cd client
npm run build
cd ..
```

### 2. Setup Backend

```bash
cd server
npm install --production
pm2 start index.js --name "pim-backend"
pm2 save
cd ..
```

### 3. Setup Nginx

ดูรายละเอียดใน `DEPLOYMENT.md`

---

## ☁️ วิธี Cloud (Railway/Render)

### Backend (Railway/Render)
1. สร้าง New Project
2. Connect GitHub
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Environment Variables:
   - `PORT=5000`
   - `JWT_SECRET=your_secret`
   - `DATABASE_URL=sqlite:./database/pim_learning.db`

### Frontend (Vercel/Netlify)
1. สร้าง New Project
2. Root Directory: `client`
3. Build Command: `npm run build`
4. Publish Directory: `build`
5. Environment Variables:
   - `REACT_APP_API_URL=https://your-backend-url.com/api`

---

## ✅ Checklist

- [ ] เปลี่ยน JWT_SECRET
- [ ] ตั้งค่า CORS
- [ ] ตั้งค่า Environment Variables
- [ ] Build Frontend สำเร็จ
- [ ] Backend รันได้
- [ ] ทดสอบ Login
- [ ] ทดสอบ API

---

## 🔒 Security

**สำคัญ:** เปลี่ยน JWT_SECRET ก่อน deploy!

```bash
# สร้าง secret key
openssl rand -base64 32
```

