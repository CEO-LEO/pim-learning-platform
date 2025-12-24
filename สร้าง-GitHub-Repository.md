# 📦 สร้าง GitHub Repository สำหรับ PIMX

## ❌ ปัญหา: ไม่เห็น PIMX ใน Vercel

**สาเหตุ**: Code ยังไม่ได้ push ขึ้น GitHub

---

## ✅ ขั้นตอนที่ 1: สร้าง GitHub Repository

### 1.1 ไปที่ GitHub
1. เปิดเบราว์เซอร์
2. ไปที่: **https://github.com/new**
3. **Login** ด้วย GitHub account

### 1.2 สร้าง Repository
1. **Repository name**: `pim-learning-platform` (หรือชื่ออื่นที่ต้องการ)
2. **Description**: `PIM Learning Platform - แพลตฟอร์มการเรียนรู้มหาวิทยาลัยปัญญาภิวัฒน์`
3. **Public** หรือ **Private** (เลือกตามต้องการ)
4. **อย่า** check "Initialize with README"
5. **อย่า** check "Add .gitignore"
6. **อย่า** check "Choose a license"
7. คลิก **Create repository**

### 1.3 คัดลอก URL
- GitHub จะแสดง URL เช่น: `https://github.com/your-username/pim-learning-platform.git`
- **คัดลอก URL นี้ไว้**

---

## ✅ ขั้นตอนที่ 2: Push Code ขึ้น GitHub

### 2.1 เปิด PowerShell
1. กด `Win + X`
2. เลือก **Windows PowerShell** หรือ **Terminal**

### 2.2 รันคำสั่ง
```powershell
cd C:\PIMX
git remote add origin https://github.com/your-username/pim-learning-platform.git
git branch -M main
git push -u origin main
```

**หมายเหตุ**: แทนที่ `your-username` และ `pim-learning-platform` ด้วย URL ที่คุณคัดลอกมา

### 2.3 ถ้ามี Error
- ถ้า GitHub ต้องการ Authentication:
  - ใช้ **Personal Access Token** แทน password
  - สร้างได้ที่: https://github.com/settings/tokens
  - เลือก scope: `repo`

---

## ✅ ขั้นตอนที่ 3: Import ใน Vercel

### 3.1 กลับไปที่ Vercel
1. ไปที่: **https://vercel.com/new**
2. ควรเห็น repository **"pim-learning-platform"** ในรายการ

### 3.2 Import Repository
1. คลิก **Import** ข้าง repository "pim-learning-platform"
2. ตั้งค่า:
   - **Project Name**: `pim-learning-platform` (หรือชื่ออื่น)
   - **Root Directory**: `client` ⚠️ **สำคัญมาก!**
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3.3 ตั้งค่า Environment Variables
1. คลิก **Environment Variables**
2. เพิ่ม:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend.railway.app/api`
   - **Environment**: เลือกทั้ง 3 อัน

### 3.4 Deploy
1. คลิก **Deploy**
2. รอให้เสร็จ (ประมาณ 3-5 นาที)

---

## ✅ Checklist

- [ ] สร้าง GitHub repository แล้ว
- [ ] Push code ขึ้น GitHub แล้ว
- [ ] เห็น repository ใน Vercel แล้ว
- [ ] Import repository แล้ว
- [ ] ตั้ง Root Directory = `client` แล้ว
- [ ] ตั้ง Environment Variables แล้ว
- [ ] Deploy สำเร็จแล้ว

---

## 🆘 ถ้ายังไม่เห็น Repository

1. **Refresh** หน้า Vercel (F5)
2. ตรวจสอบว่า push สำเร็จ:
   - ไปที่ GitHub repository
   - ควรเห็นไฟล์ทั้งหมด
3. **Logout และ Login** Vercel อีกครั้ง
4. ตรวจสอบว่า Vercel เชื่อมต่อกับ GitHub account ที่ถูกต้อง

---

## 💡 Tips

- ✅ Repository name ใช้ `pim-learning-platform` หรือ `pimx` ก็ได้
- ✅ ต้อง push code ขึ้น GitHub ก่อนถึงจะเห็นใน Vercel
- ✅ Root Directory ต้องเป็น `client` ไม่ใช่ root

