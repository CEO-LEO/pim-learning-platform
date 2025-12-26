# 🔧 แก้ Error สุดท้าย - Root Directory

## ❌ ปัญหา: `npm error Missing script: "build"`

**สาเหตุ**: Vercel ยังรัน build จาก **root directory** แทนที่จะเป็น `client` directory

จาก Build Logs:
- Vercel รัน `npm install` จาก root
- Vercel รัน `npm run build` จาก root ← **Error!**
- Root package.json ไม่มี build script

---

## ✅ วิธีแก้ไข (ทำตามนี้)

### วิธีที่ 1: ตั้ง Root Directory ใน Vercel (สำคัญที่สุด!)

1. ไปที่ **Vercel Dashboard**
2. เลือก Project **"pim-learning-platform"**
3. ไปที่ **Settings** → **Build and Deployment**
4. หา **"Root Directory"**
5. **ตั้งเป็น**: `client`
6. **Save**

**⚠️ ต้องทำขั้นตอนนี้!** ถ้าไม่ตั้ง Root Directory Vercel จะรันจาก root เสมอ

---

### วิธีที่ 2: ตรวจสอบการตั้งค่า

ใน **Settings** → **Build and Deployment** ตรวจสอบว่า:

- **Root Directory**: `client` ⚠️ **สำคัญมาก!**
- **Framework Preset**: `Create React App` หรือ `Other`
- **Build Command**: `npm run build` (ไม่ใส่ cd client)
- **Output Directory**: `build` (ไม่ใส่ client/build)
- **Install Command**: `npm install` (หรือเว้นว่าง)

---

### วิธีที่ 3: Redeploy

1. ไปที่ **Deployments** tab
2. คลิก **...** (three dots) → **Redeploy**
3. รอให้เสร็จ
4. ดู Build Logs ว่า build จาก directory ไหน

**ถ้ายัง build จาก root** = Root Directory ยังไม่ได้ตั้ง

---

## 🆘 ถ้ายังไม่ได้ - ลบ Project แล้วสร้างใหม่

### Step 1: ลบ Project

1. ไปที่ **Settings** → **General**
2. เลื่อนลงล่าง
3. คลิก **Delete Project**
4. ยืนยันการลบ

### Step 2: สร้างใหม่

1. ไปที่ **https://vercel.com/new**
2. **Import Git Repository**
3. เลือก **`pim-learning-platform`**
4. **ตั้งค่า**:
   - **Root Directory**: `client` ⚠️ **สำคัญมาก!**
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**: 
     - Name: `REACT_APP_API_URL`
     - Value: `https://your-backend.railway.app/api`
5. **Deploy**

---

## ✅ Checklist

- [ ] Root Directory ใน Vercel = `client` (สำคัญที่สุด!)
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `build`
- [ ] Save แล้ว
- [ ] Redeploy แล้ว
- [ ] ตรวจสอบ Build Logs ว่า build จาก `client` directory

---

## 💡 Tips

- ✅ **Root Directory ต้องตั้งใน Vercel Settings** ไม่ใช่แค่ใน vercel.json
- ✅ หลังตั้ง Root Directory ต้อง Redeploy
- ✅ ตรวจสอบ Build Logs เพื่อยืนยันว่า build จาก directory ถูกต้อง
- ✅ ถ้ายังไม่ได้ ลบ Project แล้วสร้างใหม่ (จะแน่ใจว่า Root Directory ถูกต้อง)

---

## 🔍 ตรวจสอบว่า Root Directory ตั้งถูกต้อง

ดู Build Logs:
- ❌ ถ้าเห็น `Installing dependencies...` แล้ว `npm run build` จาก root = Root Directory ยังไม่ได้ตั้ง
- ✅ ถ้าเห็น `cd client` หรือ build จาก `client` = ถูกต้อง

