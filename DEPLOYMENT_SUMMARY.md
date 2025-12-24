# 📦 สรุปการ Deploy PIM Learning Platform

## ✅ ไฟล์ที่สร้างไว้แล้ว

### Docker Files
- ✅ `Dockerfile.backend` - สำหรับ Backend
- ✅ `Dockerfile.frontend` - สำหรับ Frontend  
- ✅ `docker-compose.yml` - สำหรับรันทั้งระบบ
- ✅ `nginx.conf` - Configuration สำหรับ Nginx
- ✅ `.dockerignore` - ไฟล์ที่ต้อง ignore

### Deployment Scripts
- ✅ `deploy.sh` - Script สำหรับ Linux/Mac
- ✅ `deploy.bat` - Script สำหรับ Windows
- ✅ `DEPLOYMENT.md` - คู่มือการ Deploy แบบละเอียด
- ✅ `QUICK_DEPLOY.md` - คู่มือ Deploy แบบเร็ว

### Configuration
- ✅ `.env.example` - ตัวอย่าง Environment Variables

---

## 🚀 วิธี Deploy ที่แนะนำ

### วิธีที่ 1: Docker (ง่ายที่สุด) ⭐

```bash
# 1. ตั้งค่า environment variables
cp .env.example .env
# แก้ไข .env ให้เหมาะสม

# 2. Build และ Run
docker-compose up -d

# 3. ดู logs
docker-compose logs -f
```

**ข้อดี:**
- ✅ ง่ายและเร็ว
- ✅ ไม่ต้องตั้งค่า Node.js บน server
- ✅ Isolated environment
- ✅ Auto-restart

---

### วิธีที่ 2: VPS + PM2 + Nginx (Production) ⭐⭐

```bash
# 1. Build Frontend
cd client
npm run build
cd ..

# 2. Setup Backend with PM2
cd server
npm install --production
pm2 start index.js --name "pim-backend"
pm2 save
cd ..

# 3. Setup Nginx (ดู DEPLOYMENT.md)
```

**ข้อดี:**
- ✅ ควบคุมได้เต็มที่
- ✅ ประสิทธิภาพดี
- ✅ เหมาะสำหรับ production

---

### วิธีที่ 3: Cloud Platforms

#### Backend: Railway/Render
- Connect GitHub
- Root: `server`
- Start: `node index.js`

#### Frontend: Vercel/Netlify
- Root: `client`
- Build: `npm run build`
- Publish: `build`

---

## ⚙️ Environment Variables ที่ต้องตั้งค่า

### Backend (`server/.env`)
```
PORT=5000
JWT_SECRET=your_very_secure_secret_key_here
DATABASE_URL=sqlite:./database/pim_learning.db
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Frontend (`client/.env`)
```
REACT_APP_API_URL=https://your-domain.com/api
```

---

## 🔒 Security Checklist

- [ ] เปลี่ยน JWT_SECRET เป็นค่าใหม่ที่แข็งแรง
- [ ] ตั้งค่า ALLOWED_ORIGINS ใน production
- [ ] ใช้ HTTPS (SSL Certificate)
- [ ] ตั้งค่า Firewall
- [ ] Backup database เป็นประจำ
- [ ] ตรวจสอบ file permissions

---

## 📋 ขั้นตอน Deploy

1. **เตรียม Server**
   - ติดตั้ง Node.js 18+
   - ติดตั้ง Docker (ถ้าใช้ Docker)
   - ติดตั้ง PM2 (ถ้าใช้ VPS)

2. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd PIMX
   ```

3. **ตั้งค่า Environment Variables**
   ```bash
   cp .env.example .env
   # แก้ไข .env
   ```

4. **Build และ Deploy**
   - Docker: `docker-compose up -d`
   - VPS: ใช้ `deploy.sh` หรือทำตาม DEPLOYMENT.md

5. **ตรวจสอบ**
   - Frontend: http://your-domain.com
   - Backend: http://your-domain.com:5000
   - Health: http://your-domain.com:5000/api/health

---

## 🎯 Quick Start

### Docker (เร็วที่สุด):
```bash
docker-compose up -d
```

### VPS:
```bash
./deploy.sh  # Linux/Mac
# หรือ
deploy.bat   # Windows
```

---

## 📞 Support

ดูรายละเอียดเพิ่มเติมใน:
- `DEPLOYMENT.md` - คู่มือแบบละเอียด
- `QUICK_DEPLOY.md` - คู่มือแบบเร็ว

---

**อัพเดทล่าสุด:** 24 ธันวาคม 2568

