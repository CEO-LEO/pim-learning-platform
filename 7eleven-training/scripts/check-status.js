const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('\n🔍 ตรวจสอบสถานะระบบ\n');
console.log('='.repeat(70));

// Check 1: Environment variables
console.log('\n📋 1. ตรวจสอบ Environment Variables\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL หรือ NEXT_PUBLIC_SUPABASE_ANON_KEY ไม่ได้ตั้งค่า');
} else if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials ยังเป็น placeholder');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: ตั้งค่าแล้ว');
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ตั้งค่าแล้ว');
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL ไม่ได้ตั้งค่า (จำเป็นสำหรับ Prisma migrations)');
} else {
  console.log('✅ DATABASE_URL: ตั้งค่าแล้ว');
}

// Check 2: Prisma migrations
console.log('\n📋 2. ตรวจสอบ Prisma Migrations\n');

const migrationsPath = path.join(__dirname, '../prisma/migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath);
  if (migrations.length > 0) {
    console.log(`✅ พบ Prisma migrations: ${migrations.length} ไฟล์`);
  } else {
    console.error('❌ Prisma migrations folder ว่างเปล่า');
  }
} else {
  console.error('❌ Prisma migrations folder ไม่มี');
}

// Check 3: SQLite database
console.log('\n📋 3. ตรวจสอบ SQLite Database (PIMX)\n');

const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');
if (fs.existsSync(sqliteDbPath)) {
  console.log('✅ พบ SQLite database');
  
  const db = new sqlite3.Database(sqliteDbPath, (err) => {
    if (err) {
      console.error('❌ ไม่สามารถเปิด SQLite database:', err.message);
      return;
    }
    
    db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, row) => {
      if (err) {
        console.error('❌ Error querying SQLite:', err.message);
      } else {
        console.log(`✅ จำนวนนักเรียนใน SQLite: ${row.count} คน`);
      }
      db.close();
    });
  });
} else {
  console.error(`❌ ไม่พบ SQLite database: ${sqliteDbPath}`);
}

// Check 4: Supabase connection
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
  console.log('\n📋 4. ตรวจสอบการเชื่อมต่อ Supabase\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  (async () => {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.error('❌ ตาราง "users" ไม่มีใน Supabase (ต้องรัน Prisma migrations)');
        } else {
          console.error('❌ Error connecting to Supabase:', error.message);
        }
      } else {
        console.log('✅ เชื่อมต่อ Supabase สำเร็จ');
        console.log(`✅ จำนวนนักเรียนใน Supabase: ${count} คน`);
      }
    } catch (err) {
      if (err.message.includes('ENOTFOUND') || err.message.includes('fetch failed')) {
        console.error('❌ ไม่สามารถเชื่อมต่อกับ Supabase ได้');
        console.error('   ตรวจสอบ: Internet connection, Supabase URL, Supabase Key');
      } else {
        console.error('❌ Unexpected error:', err.message);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📝 คำแนะนำ:\n');
    
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      console.log('1. ตั้งค่า Supabase credentials ใน .env.local:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
    }
    
    if (!databaseUrl) {
      console.log('2. ตั้งค่า DATABASE_URL ใน .env.local:');
      console.log('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n');
    }
    
    console.log('3. รัน Prisma migrations:');
    console.log('   npx prisma migrate dev\n');
    
    console.log('4. Import ข้อมูลนักเรียน:');
    console.log('   npm run setup\n');
    
    console.log('='.repeat(70) + '\n');
  })();
} else {
  console.log('\n📋 4. ตรวจสอบการเชื่อมต่อ Supabase\n');
  console.log('⏭️  ข้าม (ยังไม่มี Supabase credentials)\n');
  
  console.log('='.repeat(70));
  console.log('\n📝 คำแนะนำ:\n');
  console.log('1. ตั้งค่า Supabase credentials ใน .env.local');
  console.log('2. รัน npm run check-status อีกครั้ง\n');
  console.log('='.repeat(70) + '\n');
}

