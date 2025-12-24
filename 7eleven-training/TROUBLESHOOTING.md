# 🔧 คู่มือการแก้ไขปัญหา (Troubleshooting)

## 📋 สารบัญ

1. [ปัญหาการตั้งค่า Environment Variables](#ปัญหาการตั้งค่า-environment-variables)
2. [ปัญหาการเชื่อมต่อ Supabase](#ปัญหาการเชื่อมต่อ-supabase)
3. [ปัญหาการรัน Prisma Migrations](#ปัญหาการรัน-prisma-migrations)
4. [ปัญหาการ Import ข้อมูล](#ปัญหาการ-import-ข้อมูล)
5. [ปัญหาทั่วไป](#ปัญหาทั่วไป)

---

## ปัญหาการตั้งค่า Environment Variables

### ❌ Error: "Supabase credentials ยังเป็น placeholder"

**สาเหตุ:** ยังไม่ได้ตั้งค่า Supabase credentials ใน `.env.local`

**วิธีแก้:**
```bash
npm run init-env
```

หรือแก้ไขไฟล์ `.env.local` ด้วยตนเอง:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

---

### ❌ Error: "DATABASE_URL ไม่ได้ตั้งค่า"

**สาเหตุ:** ยังไม่ได้ตั้งค่า `DATABASE_URL` ใน `.env.local`

**วิธีแก้:**
1. ไปที่ Supabase Dashboard → Settings → Database
2. คัดลอก Connection String (URI)
3. แทนที่ `[PASSWORD]` ด้วยรหัสผ่าน Database
4. เพิ่มใน `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
   ```

---

## ปัญหาการเชื่อมต่อ Supabase

### ❌ Error: "ไม่สามารถเชื่อมต่อกับ Supabase ได้"

**สาเหตุที่เป็นไปได้:**
- Internet connection มีปัญหา
- Supabase URL หรือ Key ไม่ถูกต้อง
- Supabase project ถูก pause หรือลบ
- Firewall หรือ proxy block การเชื่อมต่อ

**วิธีแก้:**
1. ทดสอบการเชื่อมต่อ:
   ```bash
   npm run test-connection
   ```

2. ตรวจสอบ Supabase Dashboard:
   - ไปที่ https://app.supabase.com
   - ตรวจสอบว่า Project ยัง active อยู่
   - ตรวจสอบ Settings → API → Project URL และ anon key

3. ตรวจสอบ Internet connection:
   ```bash
   ping supabase.co
   ```

4. ตรวจสอบ Firewall/Proxy:
   - ตรวจสอบว่า firewall ไม่ได้ block การเชื่อมต่อ
   - ถ้าใช้ proxy ให้ตั้งค่า proxy ใน environment variables

---

### ❌ Error: "ตาราง 'users' ไม่มีใน Supabase database"

**สาเหตุ:** ยังไม่ได้รัน Prisma migrations

**วิธีแก้:**
```bash
npx prisma migrate dev
```

หรือใช้สคริปต์ setup:
```bash
npm run setup
```

---

## ปัญหาการรัน Prisma Migrations

### ❌ Error: "Can't reach database server"

**สาเหตุ:** `DATABASE_URL` ไม่ถูกต้องหรือ database server ไม่สามารถเข้าถึงได้

**วิธีแก้:**
1. ตรวจสอบ `DATABASE_URL` ใน `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
   ```

2. ตรวจสอบว่า:
   - Password ถูกต้อง
   - Project reference (`xxxxx`) ถูกต้อง
   - Port 5432 ไม่ถูก block

3. ทดสอบการเชื่อมต่อ:
   ```bash
   npx prisma db pull
   ```

---

### ❌ Error: "Migration failed to apply"

**สาเหตุ:** Migration มีปัญหา หรือ database schema ไม่ตรงกับ Prisma schema

**วิธีแก้:**
1. ตรวจสอบ Prisma schema:
   ```bash
   npx prisma validate
   ```

2. Reset database (⚠️ จะลบข้อมูลทั้งหมด):
   ```bash
   npx prisma migrate reset
   ```

3. สร้าง migration ใหม่:
   ```bash
   npx prisma migrate dev --name fix_migration
   ```

---

## ปัญหาการ Import ข้อมูล

### ❌ Error: "ไม่พบ SQLite database"

**สาเหตุ:** ไฟล์ `C:\PIMX\server\database\pim_learning.db` ไม่มี

**วิธีแก้:**
1. ตรวจสอบว่า PIMX project มี SQLite database
2. ตรวจสอบ path ที่ถูกต้อง:
   ```
   C:\PIMX\server\database\pim_learning.db
   ```
3. Import ข้อมูลนักเรียนเข้า SQLite ก่อน (ใช้สคริปต์ใน PIMX project)

---

### ❌ Error: "จำนวนนักเรียนใน Supabase น้อยกว่าใน SQLite"

**สาเหตุ:** บางคนอาจมีอยู่แล้วใน Supabase (ถูกข้าม) หรือเกิด error ระหว่าง import

**วิธีแก้:**
1. ตรวจสอบด้วย:
   ```bash
   npm run check-status
   ```

2. Import อีกครั้ง (จะข้ามคนที่มีอยู่แล้ว):
   ```bash
   npm run import-students
   ```

3. ตรวจสอบ logs ใน terminal เพื่อดู error messages

---

### ❌ Error: "Error inserting batch"

**สาเหตุ:** ข้อมูลบางคนอาจมีปัญหา (เช่น student_id ซ้ำ, format ไม่ถูกต้อง)

**วิธีแก้:**
1. ตรวจสอบ logs ใน terminal เพื่อดูรายละเอียด error
2. ตรวจสอบข้อมูลใน SQLite:
   ```bash
   # ใช้ SQLite browser หรือ command line
   sqlite3 C:\PIMX\server\database\pim_learning.db
   SELECT student_id, name FROM users WHERE role = 'student' LIMIT 10;
   ```
3. แก้ไขข้อมูลที่ผิดพลาดใน SQLite
4. Import อีกครั้ง

---

## ปัญหาทั่วไป

### ❌ Error: "Cannot find module"

**สาเหตุ:** Dependencies ยังไม่ได้ติดตั้ง

**วิธีแก้:**
```bash
npm install
```

---

### ❌ Error: "Prisma Client not generated"

**สาเหตุ:** ยังไม่ได้ generate Prisma Client

**วิธีแก้:**
```bash
npx prisma generate
```

---

### ⚠️ ระบบทำงานช้า

**สาเหตุที่เป็นไปได้:**
- Import ข้อมูลจำนวนมาก (3,230 คน)
- Network connection ช้า
- Supabase free tier มี rate limit

**วิธีแก้:**
1. รอให้ import เสร็จ (ใช้เวลา 5-10 นาที สำหรับ 3,230 คน)
2. ตรวจสอบ progress ใน terminal
3. ถ้ายังช้ามาก ให้ตรวจสอบ Supabase Dashboard → Logs

---

## 🔍 เครื่องมือช่วยตรวจสอบ

### 1. ตรวจสอบสถานะระบบ
```bash
npm run check-status
```

### 2. ตรวจสอบความพร้อม
```bash
npm run verify
```

### 3. ทดสอบการเชื่อมต่อ Supabase
```bash
npm run test-connection
```

### 4. ตรวจสอบ Prisma schema
```bash
npx prisma validate
```

### 5. ดูข้อมูลใน database
```bash
npx prisma studio
```

---

## 📞 ขั้นตอนการขอความช่วยเหลือ

ถ้ายังแก้ปัญหาไม่ได้:

1. **รวบรวมข้อมูล:**
   - Error message ที่แน่นอน
   - Output จาก `npm run check-status`
   - Output จาก `npm run verify`
   - Output จาก `npm run test-connection`

2. **ตรวจสอบ logs:**
   - Terminal output
   - Supabase Dashboard → Logs
   - Browser console (ถ้าเป็น frontend error)

3. **ตรวจสอบเอกสาร:**
   - [SETUP.md](./SETUP.md)
   - [README-IMPORT.md](./README-IMPORT.md)
   - [Prisma Documentation](https://www.prisma.io/docs)
   - [Supabase Documentation](https://supabase.com/docs)

---

## ✅ Checklist การแก้ไขปัญหา

- [ ] ตรวจสอบ Environment Variables (`npm run check-status`)
- [ ] ทดสอบการเชื่อมต่อ Supabase (`npm run test-connection`)
- [ ] ตรวจสอบ Prisma schema (`npx prisma validate`)
- [ ] ตรวจสอบ SQLite database (มีข้อมูลหรือไม่)
- [ ] ตรวจสอบ Supabase Dashboard (project active หรือไม่)
- [ ] ตรวจสอบ Internet connection
- [ ] ตรวจสอบ logs ใน terminal และ Supabase Dashboard

---

## 🎯 คำสั่งที่ใช้บ่อย

```bash
# ตรวจสอบสถานะ
npm run check-status
npm run verify
npm run test-connection

# Setup
npm run init-env
npm run setup

# Import
npm run import-students

# Prisma
npx prisma migrate dev
npx prisma generate
npx prisma studio
npx prisma validate
```

