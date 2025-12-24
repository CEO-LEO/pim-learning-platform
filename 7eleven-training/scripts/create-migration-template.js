const fs = require('fs');
const path = require('path');

console.log('\n📝 สร้าง Prisma Migration Template\n');
console.log('='.repeat(70));

const migrationsDir = path.join(__dirname, '../prisma/migrations');

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('✅ สร้างโฟลเดอร์ prisma/migrations\n');
}

// Check if migrations already exist
const existingMigrations = fs.existsSync(migrationsDir) 
  ? fs.readdirSync(migrationsDir).filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
  : [];

if (existingMigrations.length > 0) {
  console.log(`⚠️  พบ migrations ที่มีอยู่แล้ว: ${existingMigrations.length} ไฟล์\n`);
  console.log('💡 ถ้าต้องการสร้าง migration ใหม่ ให้รัน:');
  console.log('   npx prisma migrate dev --name migration_name\n');
} else {
  console.log('📋 ยังไม่มี migrations');
  console.log('\n💡 วิธีสร้าง migration:');
  console.log('   1. ตั้งค่า DATABASE_URL ใน .env.local');
  console.log('   2. รัน: npx prisma migrate dev --name init');
  console.log('   3. หรือใช้: npm run setup (จะรัน migrations อัตโนมัติ)\n');
}

console.log('='.repeat(70) + '\n');

