# 📦 วิธีสร้าง GitHub Repository (Step by Step)

## ✅ ขั้นตอนที่ 1: ไปที่ GitHub

1. เปิดเบราว์เซอร์
2. ไปที่: **https://github.com/new**
3. **Login** ด้วย GitHub account ของคุณ (ถ้ายังไม่ได้ login)

---

## ✅ ขั้นตอนที่ 2: สร้าง Repository

1. **Repository name**: ใส่ `pim-learning-platform`
   - หรือชื่ออื่นที่ต้องการ เช่น `pimx`, `pim-learning`

2. **Description** (ไม่บังคับ): `PIM Learning Platform`

3. **Public หรือ Private**: เลือกตามต้องการ
   - **Public** = ทุกคนเห็นได้ (แนะนำ)
   - **Private** = เฉพาะคุณเห็น

4. **อย่า check** ✅ "Initialize this repository with:"
   - อย่า check "Add a README file"
   - อย่า check "Add .gitignore"
   - อย่า check "Choose a license"

5. คลิก **"Create repository"** (ปุ่มสีเขียว)

---

## ✅ ขั้นตอนที่ 3: คัดลอก URL

หลังจากสร้าง repository แล้ว GitHub จะแสดงหน้าใหม่ที่มี URL เช่น:

```
https://github.com/CEO-LEO/pim-learning-platform.git
```

**คัดลอก URL นี้ไว้** (จะใช้ในขั้นตอนถัดไป)

---

## ✅ ขั้นตอนที่ 4: Push Code

เปิด **PowerShell** แล้วรันคำสั่งนี้:

```powershell
cd C:\PIMX
git remote add origin https://github.com/CEO-LEO/pim-learning-platform.git
git push -u origin main
```

**หมายเหตุ**: แทนที่ `CEO-LEO` และ `pim-learning-platform` ด้วย URL จริงของคุณ

---

## ✅ ขั้นตอนที่ 5: Refresh Vercel

1. กลับไปที่ Vercel: **https://vercel.com/new**
2. กด **F5** (Refresh)
3. ควรเห็น repository **"pim-learning-platform"** ในรายการ
4. คลิก **Import**

---

## 🆘 ถ้า Push ไม่ได้

### ถ้า GitHub ถาม Username/Password:

- **Username**: GitHub username ของคุณ
- **Password**: ใช้ **Personal Access Token** (ไม่ใช่ password จริง)
  - สร้างได้ที่: **https://github.com/settings/tokens**
  - คลิก **"Generate new token"** → **"Generate new token (classic)"**
  - เลือก scope: ✅ **repo** (เลือกทั้งหมด)
  - คลิก **"Generate token"**
  - **คัดลอก token** มาใช้แทน password

---

## ✅ Checklist

- [ ] สร้าง GitHub repository แล้ว
- [ ] คัดลอก URL แล้ว
- [ ] Push code แล้ว
- [ ] เห็น repository ใน Vercel แล้ว

---

## 💡 Tips

- ✅ Repository name ใช้ `pim-learning-platform` หรือ `pimx` ก็ได้
- ✅ ต้อง push code ขึ้น GitHub ก่อนถึงจะเห็นใน Vercel
- ✅ Refresh หน้า Vercel หลัง push

