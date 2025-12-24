const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
// Try to load .env.local, fallback to .env if not found
const envPath = path.join(__dirname, '../.env.local');
const fs = require('fs');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

// Supabase configuration - try multiple sources
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Try to get from command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    supabaseUrl = args[i + 1];
  }
  if (args[i] === '--key' && args[i + 1]) {
    supabaseKey = args[i + 1];
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('\n📝 วิธีตั้งค่า:');
  console.error('1. สร้างไฟล์ .env.local ในโฟลเดอร์ 7eleven-training:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
  console.error('2. หรือส่งผ่าน command line:');
  console.error('   npm run import-students -- --url "your-url" --key "your-key"\n');
  console.error('3. หรือตั้งค่า environment variables:');
  console.error('   $env:NEXT_PUBLIC_SUPABASE_URL="your-url"');
  console.error('   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"');
  console.error('   npm run import-students\n');
  process.exit(1);
}

// Check if credentials are still placeholder
if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials ยังเป็น placeholder!');
  console.error('\n📝 กรุณาแก้ไขไฟล์ .env.local และใส่ Supabase credentials จริง:');
  console.error('   1. ไปที่ https://app.supabase.com');
  console.error('   2. เลือกโปรเจกต์ของคุณ');
  console.error('   3. ไปที่ Settings → API');
  console.error('   4. คัดลอก Project URL และ anon key');
  console.error('   5. แก้ไขไฟล์ .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection before starting
console.log(`\n🔗 Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
console.log(`🔑 Using Supabase Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET'}\n`);

// Verify connection function
async function verifyConnection() {
  try {
    console.log('🔍 กำลังตรวจสอบการเชื่อมต่อ Supabase...\n');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('❌ Error: ตาราง "users" ไม่มีใน Supabase database!');
        console.error('💡 กรุณารัน Prisma migrations ก่อน:');
        console.error('   npx prisma migrate dev\n');
        return false;
      } else {
        console.error('❌ Error connecting to Supabase:', error.message);
        console.error('💡 ตรวจสอบ Supabase credentials ในไฟล์ .env.local\n');
        return false;
      }
    } else {
      console.log('✅ เชื่อมต่อ Supabase สำเร็จ!\n');
      return true;
    }
  } catch (err) {
    if (err.message.includes('ENOTFOUND') || err.message.includes('fetch failed')) {
      console.error('❌ Error: ไม่สามารถเชื่อมต่อกับ Supabase ได้!');
      console.error('💡 ตรวจสอบ:');
      console.error(`   - Supabase URL ถูกต้องหรือไม่: ${supabaseUrl}`);
      console.error('   - Internet connection');
      console.error('   - Supabase project ยัง active อยู่หรือไม่');
      console.error('   - Supabase credentials ถูกต้องหรือไม่\n');
      return false;
    } else {
      console.error('❌ Unexpected error:', err.message);
      return false;
    }
  }
}

// SQLite database path (PIMX project)
const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');

console.log('\n🚀 เริ่ม Import ข้อมูลนักเรียนจาก SQLite ไป Supabase\n');
console.log('='.repeat(70));

// Open SQLite database
const db = new sqlite3.Database(sqliteDbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

async function importStudents() {
  try {
    // Verify connection first
    const isConnected = await verifyConnection();
    if (!isConnected) {
      db.close();
      process.exit(1);
    }

    // Get all students from SQLite
    console.log('\n📋 กำลังดึงข้อมูลนักเรียนจาก SQLite...\n');
    
    db.all('SELECT student_id, name, email, password_hash, phone, year_level, role, is_whitelisted FROM users WHERE role = ? ORDER BY student_id', 
      ['student'], 
      async (err, students) => {
        if (err) {
          console.error('❌ Error fetching students:', err);
          db.close();
          process.exit(1);
        }

        if (!students || students.length === 0) {
          console.log('⚠️  ไม่พบข้อมูลนักเรียนใน SQLite database');
          db.close();
          return;
        }

        console.log(`📊 พบ ${students.length} คนใน SQLite database\n`);
        console.log('⏳ กำลัง import ข้อมูลเข้า Supabase...\n');

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Process in batches of 50
        const batchSize = 50;
        const batches = [];
        for (let i = 0; i < students.length; i += batchSize) {
          batches.push(students.slice(i, i + batchSize));
        }

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} students)...`);

          const studentsToInsert = [];

          for (const student of batch) {
            // Check if student already exists in Supabase
            const { data: existingUser } = await supabase
              .from('users')
              .select('student_id')
              .eq('student_id', student.student_id)
              .maybeSingle();

            if (existingUser) {
              skippedCount++;
              continue;
            }

            // Prepare student data for Supabase
            const studentData = {
              student_id: student.student_id.trim(),
              name: student.name.trim(),
              email: student.email ? student.email.trim() : `${student.student_id.trim()}@pim.ac.th`,
              password_hash: student.password_hash || null, // Keep existing hash if available
              phone: student.phone ? student.phone.trim() : null,
              role: student.role || 'student',
              birthdate: null, // Not available in SQLite, can be set later
              otp_code: null,
              otp_expires_at: null,
            };

            // If no password hash, create one with default password
            if (!studentData.password_hash) {
              const defaultPassword = 'student123';
              studentData.password_hash = await bcrypt.hash(defaultPassword, 10);
            }

            studentsToInsert.push(studentData);
          }

          // Insert batch into Supabase
          if (studentsToInsert.length > 0) {
            try {
              const { data, error } = await supabase
                .from('users')
                .insert(studentsToInsert)
                .select();

              if (error) {
                console.error(`   ❌ Error inserting batch ${batchIndex + 1}:`, error.message);
                console.error(`   Details:`, JSON.stringify(error, null, 2));
                errorCount += studentsToInsert.length;
              } else {
                successCount += studentsToInsert.length;
                console.log(`   ✅ Batch ${batchIndex + 1} complete: +${studentsToInsert.length} created`);
              }
            } catch (err) {
              console.error(`   ❌ Error inserting batch ${batchIndex + 1}:`, err.message);
              if (err.message.includes('fetch failed')) {
                console.error(`   ⚠️  ไม่สามารถเชื่อมต่อกับ Supabase ได้`);
                console.error(`   💡 ตรวจสอบ:`);
                console.error(`      - Supabase URL ถูกต้องหรือไม่: ${supabaseUrl}`);
                console.error(`      - Internet connection`);
                console.error(`      - Supabase project ยัง active อยู่หรือไม่`);
              }
              errorCount += studentsToInsert.length;
            }
          } else {
            console.log(`   ⏭️  Batch ${batchIndex + 1}: All students already exist, skipped`);
          }

          // Show progress
          const totalProcessed = successCount + skippedCount + errorCount;
          const percentage = ((totalProcessed / students.length) * 100).toFixed(1);
          console.log(`   📊 Progress: ${totalProcessed}/${students.length} (${percentage}%)\n`);
        }

        // Final summary
        console.log('='.repeat(70));
        console.log('\n📊 สรุปผลการ Import:\n');
        console.log(`   ✅ Import สำเร็จ: ${successCount} คน`);
        console.log(`   ⏭️  ข้าม (มีอยู่แล้ว): ${skippedCount} คน`);
        console.log(`   ❌ เกิดข้อผิดพลาด: ${errorCount} คน`);
        console.log(`   📋 รวมทั้งหมด: ${students.length} คน\n`);

        // Verify import
        try {
          const { count, error: countError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');

          if (countError) {
            console.error(`❌ Error verifying import:`, countError.message);
          } else {
            console.log(`✅ จำนวนนักเรียนใน Supabase: ${count} คน\n`);
          }
        } catch (err) {
          console.error(`❌ Error verifying import:`, err.message);
        }

        db.close();
        process.exit(0);
      }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    db.close();
    process.exit(1);
  }
}

// Start import
setTimeout(() => {
  importStudents();
}, 500);

