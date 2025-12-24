const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function quickSetup() {
  console.log('\n🚀 Quick Setup - ตั้งค่า Supabase สำหรับ 7-Eleven Training\n');
  console.log('='.repeat(70));
  console.log('\n📝 สคริปต์นี้จะช่วยตั้งค่า Supabase credentials ใน .env.local\n');
  
  const envPath = path.join(__dirname, '../.env.local');
  
  console.log('💡 หากยังไม่มี Supabase Project:');
  console.log('   1. ไปที่ https://supabase.com');
  console.log('   2. สร้าง Account และ New Project');
  console.log('   3. ไปที่ Settings → API เพื่อรับ URL และ Key\n');
  
  console.log('📋 กรุณากรอกข้อมูล:\n');
  
  const supabaseUrl = await question('Supabase Project URL (https://xxxxx.supabase.co): ');
  const supabaseKey = await question('Supabase Anon Key (eyJ...): ');
  const databaseUrl = await question('Database URL (postgresql://...) [optional]: ');
  
  if (!supabaseUrl.trim() || !supabaseKey.trim()) {
    console.error('\n❌ Supabase URL และ Key จำเป็นต้องมี!');
    rl.close();
    process.exit(1);
  }
  
  let envContent = `# Supabase Configuration
# สร้างโดยสคริปต์ quick-setup.js
# วันที่: ${new Date().toLocaleString('th-TH')}

NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey.trim()}
`;

  if (databaseUrl && databaseUrl.trim()) {
    envContent += `\n# Database Connection (สำหรับ Prisma)
DATABASE_URL=${databaseUrl.trim()}
`;
  }
  
  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ บันทึกไฟล์ .env.local สำเร็จ!\n');
    console.log('📁 ไฟล์: ' + envPath + '\n');
    console.log('='.repeat(70));
    console.log('\n📋 ขั้นตอนถัดไป:\n');
    console.log('1. รัน migrations:');
    console.log('   npx prisma migrate dev\n');
    console.log('2. สร้าง Admin user:');
    console.log('   npm run create-admin ADMIN001 admin1234\n');
    console.log('3. หรือรัน setup ทั้งหมด:');
    console.log('   npm run setup-complete\n');
    console.log('='.repeat(70));
    console.log('\n🎉 เสร็จสมบูรณ์!\n');
  } catch (err) {
    console.error('\n❌ Error writing file:', err.message);
    process.exit(1);
  }
  
  rl.close();
}

quickSetup();

