# 🚀 ตั้งค่า Vercel Environment Variable - คู่มือฉบับย่อ

## ⚡ วิธีเร็วที่สุด (3 ขั้นตอน)

### 1. หา Backend URL
- **Railway**: https://railway.app/dashboard → โปรเจค → Settings → Networking → Public Domain
- **Render**: https://dashboard.render.com/ → Service → Settings → Public URL  
- **Heroku**: https://dashboard.heroku.com/ → App → Settings → Domains

### 2. ตั้งค่าใน Vercel
1. ไปที่: https://vercel.com/dashboard
2. เลือก: `pim-learning-platform`
3. ไปที่: **Settings** → **Environment Variables**
4. คลิก: **Add New**
5. ใส่:
   ```
   Name: REACT_APP_API_URL
   Value: https://your-backend.railway.app/api
   Environment: ✅ Production ✅ Preview ✅ Development
   ```
6. คลิก: **Save**

### 3. Redeploy
- ไปที่ **Deployments** → คลิก **...** → **Redeploy**

หรือ push code ใหม่:
```bash
git commit --allow-empty -m "Redeploy"
git push
```

## ✅ ตรวจสอบ

1. เปิดหน้า video
2. กด F12 → Console
3. ควรเห็น: `REACT_APP_API_URL: https://your-backend.railway.app/api`
4. วิดีโอควรเล่นได้

## ⚠️ สำคัญ

- ต้องใส่ `/api` ต่อท้าย URL
- ตรวจสอบว่า backend มีไฟล์วิดีโอใน `server/uploads/videos/`

