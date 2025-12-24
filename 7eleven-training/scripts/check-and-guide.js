const fs = require('fs');
const path = require('path');

console.log('\n🔍 ตรวจสอบและแนะนำการ Setup\n');
console.log('='.repeat(70));

const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';
let databaseUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]?.trim() || '';
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1]?.trim() || '';
    }
    if (line.startsWith('DATABASE_URL=')) {
      databaseUrl = line.split('=')[1]?.trim() || '';
    }
  });
}

console.log('\n📋 สถานะปัจจุบัน:\n');

const hasUrl = supabaseUrl && !supabaseUrl.includes('your-project-id') && !supabaseUrl.includes('placeholder');
const hasKey = supabaseKey && !supabaseKey.includes('your-anon-key') && !supabaseKey.includes('placeholder');
const hasDbUrl = databaseUrl && databaseUrl.startsWith('postgresql://');

console.log(`   Supabase URL: ${hasUrl ? '✅ ตั้งค่าแล้ว' : '❌ ยังไม่ได้ตั้งค่า'}`);
console.log(`   Supabase Key: ${hasKey ? '✅ ตั้งค่าแล้ว' : '❌ ยังไม่ได้ตั้งค่า'}`);
console.log(`   Database URL: ${hasDbUrl ? '✅ ตั้งค่าแล้ว' : '❌ ยังไม่ได้ตั้งค่า'}`);

if (!hasUrl || !hasKey) {
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 ขั้นตอนที่ 1: ตั้งค่า Supabase Credentials\n');
  console.log('💡 วิธีที่ 1: ใช้สคริปต์ Quick Setup (แนะนำ)');
  console.log('   npm run quick-setup\n');
  console.log('💡 วิธีที่ 2: ใช้สคริปต์ Setup ครบถ้วน');
  console.log('   npm run setup-complete\n');
  console.log('💡 วิธีที่ 3: แก้ไขไฟล์ .env.local ด้วยตนเอง');
  console.log('   1. เปิดไฟล์: ' + envPath);
  console.log('   2. แก้ไข NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('   3. บันทึกไฟล์\n');
  console.log('📚 วิธีหา Supabase Credentials:');
  console.log('   1. ไปที่ https://supabase.com');
  console.log('   2. สร้าง Account และ New Project (ถ้ายังไม่มี)');
  console.log('   3. ไปที่ Settings → API');
  console.log('   4. คัดลอก Project URL และ anon public key\n');
} else {
  console.log('\n✅ Supabase credentials พร้อมใช้งาน!\n');
  
  // Check if migrations exist
  const migrationsPath = path.join(__dirname, '../prisma/migrations');
  const hasMigrations = fs.existsSync(migrationsPath) && 
                       fs.readdirSync(migrationsPath).length > 0;
  
  if (!hasMigrations) {
    console.log('='.repeat(70));
    console.log('\n📝 ขั้นตอนที่ 2: รัน Prisma Migrations\n');
    
    if (!hasDbUrl) {
      console.log('⚠️  DATABASE_URL ไม่ได้ตั้งค่า จำเป็นสำหรับ migrations!\n');
      console.log('💡 หาได้ที่: Supabase Dashboard → Settings → Database → Connection string → URI\n');
    } else {
      console.log('💡 รันคำสั่ง:');
      console.log('   npx prisma migrate dev\n');
    }
  } else {
    console.log('✅ Prisma migrations มีอยู่แล้ว\n');
  }
  
  // Check if admin exists
  console.log('='.repeat(70));
  console.log('\n📝 ขั้นตอนที่ 3: สร้าง Admin User\n');
  console.log('💡 รันคำสั่ง:');
  console.log('   npm run create-admin ADMIN001 admin1234\n');
  console.log('🔑 รหัสเข้าสู่ระบบ Admin:');
  console.log('   รหัสนักศึกษา: ADMIN001');
  console.log('   รหัสผ่าน: admin1234\n');
}

console.log('='.repeat(70));
console.log('\n📚 เอกสารเพิ่มเติม:');
console.log('   - QUICK_START.md');
console.log('   - SETUP_GUIDE.md');
console.log('   - README.md\n');

