# 🚀 คู่มือการ Deploy 7-Eleven Training System

## ขั้นตอนการ Deploy

### 1. เตรียมโปรเจกต์สำหรับ Production

#### 1.1 Build โปรเจกต์
```bash
cd 7eleven-training
npm run build
```

#### 1.2 ตรวจสอบ Build
```bash
npm run start
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` เพื่อทดสอบ

---

## วิธีที่ 1: Deploy บน Vercel (แนะนำ - ง่ายที่สุด)

### ขั้นตอน:
1. **ติดตั้ง Vercel CLI** (ถ้ายังไม่มี):
   ```bash
   npm install -g vercel
   ```

2. **Login Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd 7eleven-training
   vercel
   ```
   - เลือก "Link to existing project" หรือ "Create new project"
   - ตั้งค่า Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `DATABASE_URL` (ถ้ามี)

4. **Deploy Production**:
   ```bash
   vercel --prod
   ```

### ข้อดี:
- ✅ ฟรีสำหรับ Personal projects
- ✅ Auto-deploy จาก Git
- ✅ SSL Certificate อัตโนมัติ
- ✅ CDN และ Edge Network
- ✅ ง่ายและเร็ว

---

## วิธีที่ 2: Deploy บน Railway

### ขั้นตอน:
1. ไปที่ [railway.app](https://railway.app)
2. สร้าง Account และ New Project
3. Deploy from GitHub หรือ Deploy from local
4. ตั้งค่า Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`

### ข้อดี:
- ✅ ฟรี $5 credit ต่อเดือน
- ✅ Auto-deploy
- ✅ Database hosting ได้

---

## วิธีที่ 3: Deploy บน DigitalOcean App Platform

### ขั้นตอน:
1. ไปที่ [digitalocean.com](https://digitalocean.com)
2. สร้าง App Platform project
3. Connect GitHub repository
4. ตั้งค่า Environment Variables
5. Deploy

### ข้อดี:
- ✅ เริ่มต้น $5/เดือน
- ✅ Auto-scaling
- ✅ Database hosting

---

## วิธีที่ 4: Deploy บน VPS (Ubuntu/Debian)

### ขั้นตอน:

#### 4.1 เตรียมเซิร์ฟเวอร์
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

#### 4.2 Clone และ Setup โปรเจกต์
```bash
# Clone repository
git clone <your-repo-url> /var/www/7eleven-training
cd /var/www/7eleven-training/7eleven-training

# Install dependencies
npm install

# Build
npm run build

# สร้างไฟล์ .env.local
nano .env.local
# เพิ่ม:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### 4.3 ใช้ PM2 รัน Production Server
```bash
# Start with PM2
pm2 start npm --name "7eleven-training" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 4.4 ตั้งค่า Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/7eleven-training
```

เพิ่มเนื้อหา:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/7eleven-training /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 4.5 ตั้งค่า SSL ด้วย Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## วิธีที่ 5: Deploy ด้วย Docker

### สร้าง Dockerfile:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### สร้าง docker-compose.yml:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
```

### Build และ Run:
```bash
docker-compose build
docker-compose up -d
```

---

## Environment Variables ที่ต้องตั้งค่า

### บน Production Server:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `DATABASE_URL` - Database Connection String (Optional)

### วิธีตั้งค่า:
- **Vercel**: Project Settings → Environment Variables
- **Railway**: Variables tab
- **VPS**: แก้ไขไฟล์ `.env.local` หรือใช้ `export` command

---

## Checklist ก่อน Deploy

- [ ] Build สำเร็จ (`npm run build`)
- [ ] ทดสอบ Production build (`npm run start`)
- [ ] ตั้งค่า Environment Variables
- [ ] ตรวจสอบ Supabase credentials
- [ ] สร้าง Admin user (`npm run create-admin`)
- [ ] ทดสอบ Login
- [ ] Backup database (ถ้ามี)

---

## Troubleshooting

### ปัญหา: Build ล้มเหลว
**แก้ไข:**
```bash
# ลบ cache และ rebuild
rm -rf .next node_modules
npm install
npm run build
```

### ปัญหา: Environment Variables ไม่ทำงาน
**แก้ไข:**
- ตรวจสอบว่าใช้ `NEXT_PUBLIC_` prefix สำหรับ client-side variables
- Restart server หลังจากเปลี่ยน environment variables

### ปัญหา: 404 Not Found
**แก้ไข:**
- ตรวจสอบ Nginx configuration
- ตรวจสอบว่า Next.js server รันอยู่
- ตรวจสอบ firewall settings

---

## คำแนะนำเพิ่มเติม

1. **ใช้ Git** สำหรับ version control
2. **Setup CI/CD** สำหรับ auto-deploy
3. **Monitor** ด้วย tools เช่น Sentry, LogRocket
4. **Backup** database เป็นประจำ
5. **Use CDN** สำหรับ static assets

---

## Support

หากมีปัญหาการ Deploy:
- ตรวจสอบ logs: `pm2 logs` หรือ `docker logs`
- ตรวจสอบ Next.js logs ใน `.next` folder
- ดู documentation: [Next.js Deployment](https://nextjs.org/docs/deployment)

