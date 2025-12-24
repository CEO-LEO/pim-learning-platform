# 📝 วิธีตั้งค่า Supabase

## วิธีที่ 1: ใช้สคริปต์ Interactive (แนะนำ)

```bash
npm run quick-setup
```

สคริปต์จะถามข้อมูลทีละข้อ:
1. Supabase Project URL
2. Supabase Anon Key  
3. Database URL (optional)

## วิธีที่ 2: ใช้ Command Line Arguments

```bash
node scripts/setup-env.js [SUPABASE_URL] [SUPABASE_KEY] [DATABASE_URL]
```

**ตัวอย่าง:**
```bash
node scripts/setup-env.js https://xxxxx.supabase.co eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## วิธีที่ 3: แก้ไขไฟล์ .env.local ด้วยตนเอง

1. เปิดไฟล์ `.env.local`
2. แก้ไขข้อมูล:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
   ```
3. บันทึกไฟล์

## 📚 วิธีหา Supabase Credentials

### 1. สร้าง Supabase Project (ถ้ายังไม่มี)
- ไปที่ https://supabase.com
- สร้าง Account (ถ้ายังไม่มี)
- คลิก "New Project"
- กรอกข้อมูล Project:
  - Name: ตั้งชื่อโปรเจกต์
  - Database Password: ตั้งรหัสผ่าน (จำไว้!)
  - Region: เลือก region ที่ใกล้ที่สุด
- คลิก "Create new project"
- รอให้ project สร้างเสร็จ (ประมาณ 2-3 นาที)

### 2. หา Project URL และ Anon Key
- ไปที่ **Settings** → **API**
- **Project URL**: คัดลอกจาก "Project URL" (https://xxxxx.supabase.co)
- **anon public key**: คัดลอกจาก "Project API keys" → "anon public" (eyJ...)

### 3. หา Database URL
- ไปที่ **Settings** → **Database**
- คลิก "Connection string" → เลือก "URI"
- คัดลอก connection string (postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres)
- แทนที่ [PASSWORD] ด้วยรหัสผ่านที่ตั้งไว้ตอนสร้าง project

## ✅ ตรวจสอบการตั้งค่า

```bash
npm run check-status
```

หรือ

```bash
npm run guide
```

## 🎯 หลังจากตั้งค่าแล้ว

1. **รัน Prisma Migrations:**
   ```bash
   npx prisma migrate dev
   ```

2. **สร้าง Admin User:**
   ```bash
   npm run create-admin ADMIN001 admin1234
   ```

3. **Login:**
   - ไปที่ http://localhost:3000/login
   - ใช้รหัส: `ADMIN001` / `admin1234`

