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

async function main() {
  console.log('\n🔧 ระบบช่วยตั้งค่า Environment Variables\n');
  console.log('='.repeat(70));
  console.log('\n📝 สคริปต์นี้จะช่วยสร้างไฟล์ .env.local สำหรับคุณ\n');
  console.log('💡 หากยังไม่มี Supabase Project:');
  console.log('   1. ไปที่ https://supabase.com');
  console.log('   2. สร้าง Account และ New Project');
  console.log('   3. ไปที่ Settings → API เพื่อรับ URL และ Key\n');

  const envPath = path.join(__dirname, '../.env.local');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('⚠️  ไฟล์ .env.local มีอยู่แล้ว');
    const overwrite = await question('ต้องการเขียนทับหรือไม่? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n❌ ยกเลิกการตั้งค่า\n');
      rl.close();
      return;
    }
  }

  console.log('\n📋 กรุณากรอกข้อมูล Supabase:\n');

  let supabaseUrl = await question('1. Supabase Project URL (https://xxxxx.supabase.co): ');
  supabaseUrl = supabaseUrl.trim();

  if (!supabaseUrl) {
    console.log('\n❌ Supabase URL ไม่สามารถว่างเปล่าได้\n');
    rl.close();
    return;
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.log('\n⚠️  Supabase URL ดูไม่ถูกต้อง แต่จะดำเนินการต่อ...\n');
  }

  let supabaseKey = await question('2. Supabase Anon Key (eyJ...): ');
  supabaseKey = supabaseKey.trim();

  if (!supabaseKey) {
    console.log('\n❌ Supabase Key ไม่สามารถว่างเปล่าได้\n');
    rl.close();
    return;
  }

  if (!supabaseKey.startsWith('eyJ')) {
    console.log('\n⚠️  Supabase Key ดูไม่ถูกต้อง แต่จะดำเนินการต่อ...\n');
  }

  console.log('\n📋 กรุณากรอกข้อมูล Database Connection:\n');
  console.log('💡 หาได้ที่: Supabase Dashboard → Settings → Database → Connection string → URI\n');

  let databaseUrl = await question('3. Database URL (postgresql://postgres:password@...): ');
  databaseUrl = databaseUrl.trim();

  if (!databaseUrl) {
    console.log('\n⚠️  Database URL ไม่ได้กรอก จะข้ามไป (จำเป็นสำหรับ Prisma migrations)\n');
  } else if (!databaseUrl.startsWith('postgresql://')) {
    console.log('\n⚠️  Database URL ดูไม่ถูกต้อง แต่จะดำเนินการต่อ...\n');
  }

  // Create .env.local content
  let envContent = `# Supabase Configuration
# สร้างโดยสคริปต์ init-env.js
# วันที่: ${new Date().toLocaleString('th-TH')}

NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
`;

  if (databaseUrl) {
    envContent += `\n# Database Connection (สำหรับ Prisma)
DATABASE_URL=${databaseUrl}
`;
  }

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ สร้างไฟล์ .env.local สำเร็จ!\n');
    console.log('📁 ไฟล์: ' + envPath + '\n');
    console.log('📝 เนื้อหา:');
    console.log('-'.repeat(70));
    console.log(envContent);
    console.log('-'.repeat(70));
    console.log('\n🎉 ตั้งค่าเสร็จสมบูรณ์!\n');
    console.log('📋 ขั้นตอนถัดไป:');
    console.log('   1. ตรวจสอบสถานะ: npm run check-status');
    console.log('   2. Setup ระบบ: npm run setup\n');
  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาดในการสร้างไฟล์:', error.message);
  }

  rl.close();
}

main().catch(error => {
  console.error('\n❌ เกิดข้อผิดพลาด:', error);
  rl.close();
  process.exit(1);
});

