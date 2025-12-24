# 🚀 Push Code ตอนนี้ (ทำตามนี้)

## ⚡ วิธีที่ 1: ใช้ Script (ง่ายที่สุด)

### 1. สร้าง GitHub Repository ก่อน
- ไปที่: **https://github.com/new**
- สร้าง repository (ชื่ออะไรก็ได้ เช่น `pim-learning-platform`)
- **อย่า** check "Initialize with README"
- คลิก **Create repository**
- **คัดลอก URL** ที่ GitHub ให้

### 2. รัน Script
```powershell
cd C:\PIMX
.\push-now.ps1
```
- Script จะถาม URL → ใส่ URL ที่คัดลอกมา
- Script จะ push ให้อัตโนมัติ

---

## ⚡ วิธีที่ 2: ทำเอง (Manual)

### 1. สร้าง GitHub Repository
- ไปที่: **https://github.com/new**
- สร้าง repository
- คัดลอก URL

### 2. Push Code
เปิด PowerShell แล้วรัน:

```powershell
cd C:\PIMX
git remote add origin https://github.com/CEO-LEO/pim-learning-platform.git
git branch -M main
git push -u origin main
```

**แทนที่ URL** ด้วย URL จริงของคุณ

---

## ✅ หลัง Push สำเร็จ

1. ไปที่ Vercel: **https://vercel.com/new**
2. **Refresh** หน้า (F5)
3. ควรเห็น repository ในรายการ
4. คลิก **Import**
5. ตั้ง **Root Directory = `client`**
6. **Deploy**

---

## 🆘 ถ้า Push ไม่ได้

### ถ้า GitHub ถาม Username/Password:
- **Username**: GitHub username ของคุณ
- **Password**: ใช้ **Personal Access Token**
  - สร้างได้ที่: https://github.com/settings/tokens
  - เลือก scope: `repo`
  - คัดลอก token มาใช้แทน password

