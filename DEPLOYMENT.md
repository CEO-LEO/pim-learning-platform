# 🚀 คู่มือการ Deploy PIM Learning Platform

## 📋 สถานะระบบ
- **Frontend**: React App (port 3000)
- **Backend**: Express API (port 5000)
- **Database**: SQLite

---

## 🎯 วิธีที่ 1: Deploy บน VPS (แนะนำสำหรับ Production)

### ขั้นตอนที่ 1: เตรียมเซิร์ฟเวอร์

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### ขั้นตอนที่ 2: Clone และ Setup โปรเจกต์

```bash
# Clone repository
git clone <your-repo-url> /var/www/pim-learning
cd /var/www/pim-learning

# Install dependencies
npm run install-all

# Build React app
cd client
npm run build
cd ..
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

```bash
# Server .env
cd server
nano .env
```

เพิ่ม:
```
PORT=5000
JWT_SECRET=your_production_secret_key_here_change_this
DATABASE_URL=sqlite:./database/pim_learning.db
API_URL=http://localhost:5000/api
```

```bash
# Client .env (สำหรับ build)
cd ../client
nano .env
```

เพิ่ม:
```
REACT_APP_API_URL=http://your-domain.com:5000/api
```

### ขั้นตอนที่ 4: ใช้ PM2 รัน Backend

```bash
cd /var/www/pim-learning/server

# Start backend with PM2
pm2 start index.js --name "pim-backend" --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### ขั้นตอนที่ 5: ตั้งค่า Nginx

```bash
sudo nano /etc/nginx/sites-available/pim-learning
```

เพิ่มเนื้อหา:
```nginx
# Backend API
server {
    listen 5000;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/pim-learning/client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pim-learning /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### ขั้นตอนที่ 6: ตั้งค่า SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🐳 วิธีที่ 2: Deploy ด้วย Docker (แนะนำ)

### สร้าง Dockerfile สำหรับ Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./
RUN npm install --production

# Copy server files
COPY server/ ./

# Expose port
EXPOSE 5000

CMD ["node", "index.js"]
```

### สร้าง Dockerfile สำหรับ Frontend

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY client/package*.json ./
RUN npm install

# Copy source files
COPY client/ ./

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### สร้าง docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=sqlite:./database/pim_learning.db
    volumes:
      - ./server/database:/app/database
      - ./server/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Build และ Run

```bash
docker-compose build
docker-compose up -d
```

---

## ☁️ วิธีที่ 3: Deploy แยก Frontend และ Backend

### Frontend: Vercel/Netlify

```bash
cd client

# Build
npm run build

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

**ตั้งค่า Environment Variables:**
- `REACT_APP_API_URL` = `https://your-backend-domain.com/api`

### Backend: Railway/Render

1. **Railway:**
   - สร้าง New Project
   - Deploy from GitHub
   - ตั้งค่า Environment Variables
   - Deploy

2. **Render:**
   - สร้าง Web Service
   - Connect GitHub
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - ตั้งค่า Environment Variables

---

## 📝 Checklist ก่อน Deploy

- [ ] Build Frontend สำเร็จ (`cd client && npm run build`)
- [ ] ทดสอบ Backend (`cd server && npm start`)
- [ ] ตั้งค่า Environment Variables ทั้งหมด
- [ ] เปลี่ยน JWT_SECRET เป็นค่าใหม่ที่ปลอดภัย
- [ ] ตั้งค่า CORS ให้ถูกต้อง
- [ ] Backup database
- [ ] ทดสอบ API endpoints
- [ ] ตั้งค่า Firewall (เปิด port 80, 443, 5000)

---

## 🔒 Security Checklist

- [ ] เปลี่ยน JWT_SECRET เป็นค่าใหม่ที่แข็งแรง
- [ ] ตั้งค่า CORS ให้เฉพาะ domain ที่อนุญาต
- [ ] ใช้ HTTPS (SSL Certificate)
- [ ] ตั้งค่า Firewall
- [ ] ตรวจสอบ file permissions
- [ ] ใช้ environment variables สำหรับ sensitive data

---

## 🛠️ คำสั่งที่มีประโยชน์

```bash
# ดู logs
pm2 logs pim-backend

# Restart backend
pm2 restart pim-backend

# Stop backend
pm2 stop pim-backend

# ดู status
pm2 status

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 📞 Troubleshooting

### Backend ไม่ทำงาน
```bash
# ตรวจสอบ logs
pm2 logs pim-backend

# ตรวจสอบ port
netstat -tulpn | grep 5000

# Restart
pm2 restart pim-backend
```

### Frontend ไม่เชื่อมต่อกับ Backend
- ตรวจสอบ `REACT_APP_API_URL` ใน `.env`
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบ firewall

### Database Error
- ตรวจสอบ file permissions ของ database file
- ตรวจสอบ path ของ database
- Backup database ก่อน deploy

---

## 🎯 Quick Deploy Script

สร้างไฟล์ `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Build frontend
cd client
npm run build
cd ..

# Restart backend
cd server
pm2 restart pim-backend
cd ..

echo "✅ Deployment complete!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

