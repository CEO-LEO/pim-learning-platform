# 🔧 แก้ไข Vercel Build Error

## ❌ ปัญหา: `npm error Missing script: "build"`

**สาเหตุ**: Vercel ยังไม่ได้ตั้ง **Root Directory** เป็น `client`

---

## ✅ วิธีแก้ไข

### Step 1: ไปที่ Vercel Project Settings

1. ไปที่ Vercel Dashboard
2. เลือก Project **"pim-learning-platform"**
3. ไปที่ **Settings** (ด้านบน)
4. คลิก **General** (เมนูซ้าย)

### Step 2: ตั้งค่า Root Directory

1. หา **"Root Directory"** ใน Settings
2. คลิก **Edit**
3. เปลี่ยนจาก (ว่างเปล่า) หรือ `/` เป็น: **`client`**
4. คลิก **Save**

### Step 3: ตรวจสอบ Build Settings

ใน **Settings** → **General** ตรวจสอบว่า:
- **Framework Preset**: `Create React App`
- **Build Command**: `npm run build`
- **Output Directory**: `build`

### Step 4: Redeploy

1. ไปที่ **Deployments** tab
2. คลิก **...** (three dots) บน deployment ล่าสุด
3. เลือก **Redeploy**
4. รอให้เสร็จ (ประมาณ 3-5 นาที)

---

## ✅ หลังแก้ไข

- ✅ Build ควรสำเร็จ
- ✅ Frontend จะถูก deploy
- ✅ ควรเห็น URL ของเว็บไซต์

---

## 🆘 ถ้ายังไม่ได้

### วิธีที่ 1: ลบ Project แล้วสร้างใหม่

1. **Settings** → **General** → **Delete Project**
2. สร้างใหม่:
   - **Import Git Repository**
   - เลือก `pim-learning-platform`
   - **Root Directory**: `client` ⚠️ **สำคัญ!**
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Environment Variables**: `REACT_APP_API_URL`
3. **Deploy**

---

## 📝 Checklist

- [ ] Root Directory ตั้งเป็น `client` แล้ว
- [ ] Build Command เป็น `npm run build` แล้ว
- [ ] Output Directory เป็น `build` แล้ว
- [ ] Environment Variables ตั้งค่าแล้ว
- [ ] Redeploy แล้ว

