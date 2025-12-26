# 🔧 แก้ Error: Pre-deploy command failed

## ❌ ปัญหา

**Error:** `cd: server: No such file or directory`

**สาเหตุ:**
- Root Directory = `server` แล้ว (ถูกต้อง)
- แต่ `nixpacks.toml` หรือ `railway.json` ยังมี `cd server` ใน build/install commands
- เมื่อ Root Directory = `server` แล้ว Railway จะทำงานจาก `server/` directory โดยอัตโนมัติ
- ไม่ต้องใช้ `cd server` ใน start command

---

## ✅ วิธีแก้

### Option 1: ลบ nixpacks.toml (แนะนำ)

**เพราะ:**
- Root Directory = `server` แล้ว
- Railway จะใช้ `railway.json` และ Root Directory setting
- ไม่ต้องใช้ `nixpacks.toml`

**ขั้นตอน:**
1. ลบไฟล์ `nixpacks.toml`
2. ตรวจสอบ `railway.json` ว่า startCommand = `node index.js` (ไม่มี `cd server`)
3. Push ไปที่ GitHub
4. Railway จะ auto-redeploy

---

### Option 2: แก้ไข nixpacks.toml

**ถ้ายังต้องการใช้ nixpacks.toml:**
- install phase ต้องมี `cd server` เพราะ build เริ่มจาก root directory
- แต่ start command ไม่ต้องมี `cd server` เพราะ Root Directory = `server` แล้ว

---

## 📋 Checklist

- [x] Root Directory = `server` ใน Railway Settings ✅
- [ ] ลบ `nixpacks.toml` หรือแก้ไขให้ถูกต้อง
- [ ] ตรวจสอบ `railway.json` startCommand = `node index.js`
- [ ] Push ไปที่ GitHub
- [ ] Railway auto-redeploy
- [ ] ตรวจสอบ Deploy Logs ไม่มี error
- [ ] ทดสอบ `/api/health` endpoint

