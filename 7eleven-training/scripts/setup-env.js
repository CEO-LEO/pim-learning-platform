const fs = require('fs');
const path = require('path');

// Get arguments from command line
const args = process.argv.slice(2);
const supabaseUrl = args[0];
const supabaseKey = args[1];
const databaseUrl = args[2];

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing required arguments!\n');
  console.log('📝 วิธีใช้:');
  console.log('   node scripts/setup-env.js [SUPABASE_URL] [SUPABASE_KEY] [DATABASE_URL]\n');
  console.log('📝 ตัวอย่าง:');
  console.log('   node scripts/setup-env.js https://xxxxx.supabase.co eyJhbGc... postgresql://...\n');
  console.log('💡 หรือใช้สคริปต์ interactive:');
  console.log('   npm run quick-setup\n');
  process.exit(1);
}

const envPath = path.join(__dirname, '../.env.local');

let envContent = `# Supabase Configuration
# สร้างโดยสคริปต์ setup-env.js
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
  console.log('📋 เนื้อหา:');
  console.log('-'.repeat(70));
  console.log(envContent);
  console.log('-'.repeat(70));
  console.log('\n✅ ตั้งค่า Supabase credentials สำเร็จ!\n');
  console.log('📋 ขั้นตอนถัดไป:');
  console.log('1. รัน migrations: npx prisma migrate dev');
  console.log('2. สร้าง Admin: npm run create-admin ADMIN001 admin1234');
  console.log('3. Login ที่: http://localhost:3000/login\n');
} catch (err) {
  console.error('\n❌ Error writing file:', err.message);
  process.exit(1);
}

