# 🚀 Push Code ขึ้น GitHub (ทำตามนี้)

## ❌ ปัญหา: ไม่เห็น PIMX ใน Vercel

**สาเหตุ**: Code ยังไม่ได้ push ขึ้น GitHub

---

## ✅ ขั้นตอนที่ 1: สร้าง GitHub Repository

### 1. ไปที่ GitHub
- เปิด: **https://github.com/new**
- Login ด้วย GitHub account

### 2. สร้าง Repository
- **Repository name**: `pim-learning-platform` (หรือ `pimx`)
- **Description**: `PIM Learning Platform`
- เลือก **Public** หรือ **Private**
- **อย่า** check "Initialize with README"
- คลิก **Create repository**

### 3. คัดลอก URL
- GitHub จะแสดง URL เช่น: `https://github.com/CEO-LEO/pim-learning-platform.git`
- **คัดลอก URL นี้ไว้**

---

## ✅ ขั้นตอนที่ 2: Push Code ขึ้น GitHub

### เปิด PowerShell
1. กด `Win + X`
2. เลือก **Windows PowerShell**

### รันคำสั่งนี้ (แทนที่ URL ด้วย URL ที่คุณคัดลอกมา):

```powershell
cd C:\PIMX
git remote add origin https://github.com/CEO-LEO/pim-learning-platform.git
git branch -M main
git push -u origin main
```

**หมายเหตุ**: 
- แทนที่ `CEO-LEO` ด้วย username ของคุณ
- แทนที่ `pim-learning-platform` ด้วยชื่อ repository ที่คุณสร้าง

### ถ้า GitHub ถาม Username/Password:
- **Username**: GitHub username ของคุณ
- **Password**: ใช้ **Personal Access Token** (ไม่ใช่ password จริง)
  - สร้างได้ที่: https://github.com/settings/tokens
  - เลือก scope: `repo`
  - คัดลอก token มาใช้แทน password

---

## ✅ ขั้นตอนที่ 3: Import ใน Vercel

### 1. กลับไปที่ Vercel
- ไปที่: **https://vercel.com/new**
- **Refresh** หน้า (F5)
- ควรเห็น repository **"pim-learning-platform"** ในรายการ

### 2. Import Repository
1. คลิก **Import** ข้าง repository
2. ตั้งค่า:
   - **Root Directory**: `client` ⚠️ **สำคัญมาก!**
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 3. Environment Variables
- คลิก **Environment Variables**
- เพิ่ม:
  - **Name**: `REACT_APP_API_URL`
  - **Value**: `https://your-backend.railway.app/api`
  - **Environment**: เลือกทั้ง 3 อัน

### 4. Deploy
- คลิก **Deploy**
- รอให้เสร็จ

---

## ✅ Checklist

- [ ] สร้าง GitHub repository แล้ว
- [ ] Push code ขึ้น GitHub แล้ว
- [ ] เห็น repository ใน Vercel แล้ว
- [ ] Import repository แล้ว
- [ ] ตั้ง Root Directory = `client` แล้ว
- [ ] Deploy สำเร็จแล้ว

---

## 🆘 ถ้ายังไม่เห็น Repository

1. **Refresh** หน้า Vercel (F5)
2. **Logout และ Login** Vercel อีกครั้ง
3. ตรวจสอบว่า push สำเร็จ:
   - ไปที่ GitHub repository
   - ควรเห็นไฟล์ทั้งหมด

