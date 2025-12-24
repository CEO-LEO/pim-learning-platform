const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('\n🚀 ระบบ Setup และ Import ข้อมูลนักเรียน\n');
console.log('='.repeat(70));

// Step 1: Check Supabase credentials
console.log('\n📋 Step 1: ตรวจสอบ Supabase Credentials\n');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('\n📝 กรุณาสร้างไฟล์ .env.local และใส่ Supabase credentials:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials ยังเป็น placeholder!');
  console.error('\n📝 กรุณาแก้ไขไฟล์ .env.local และใส่ Supabase credentials จริง\n');
  process.exit(1);
}

console.log(`✅ Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
console.log(`✅ Supabase Key: ${supabaseKey.substring(0, 20)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Step 2: Verify Supabase connection
async function verifyConnection() {
  console.log('📋 Step 2: ตรวจสอบการเชื่อมต่อ Supabase\n');
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('❌ ตาราง "users" ไม่มีใน Supabase database!');
        console.error('\n💡 ต้องรัน Prisma migrations ก่อน:');
        console.error('   npx prisma migrate dev\n');
        return false;
      } else {
        console.error('❌ Error connecting to Supabase:', error.message);
        return false;
      }
    }
    
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ!\n');
    return true;
  } catch (err) {
    if (err.message.includes('ENOTFOUND') || err.message.includes('fetch failed')) {
      console.error('❌ ไม่สามารถเชื่อมต่อกับ Supabase ได้!');
      console.error('💡 ตรวจสอบ:');
      console.error(`   - Supabase URL: ${supabaseUrl}`);
      console.error('   - Internet connection');
      console.error('   - Supabase project ยัง active อยู่หรือไม่\n');
      return false;
    }
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

// Step 3: Check and run Prisma migrations
async function checkMigrations() {
  console.log('📋 Step 3: ตรวจสอบ Prisma Migrations\n');
  
  const migrationsPath = path.join(__dirname, '../prisma/migrations');
  const hasMigrations = fs.existsSync(migrationsPath) && 
                       fs.readdirSync(migrationsPath).length > 0;
  
  if (!hasMigrations) {
    console.log('⚠️  ยังไม่มี Prisma migrations');
    console.log('💡 กำลังรัน Prisma migrations...\n');
    
    try {
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL ไม่ได้ตั้งค่า!');
        console.error('💡 ต้องตั้งค่า DATABASE_URL ใน .env.local');
        console.error('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\n');
        return false;
      }
      
      execSync('npx prisma migrate dev --name init', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('\n✅ Prisma migrations สำเร็จ!\n');
      return true;
    } catch (err) {
      console.error('\n❌ Error running Prisma migrations:', err.message);
      console.error('💡 กรุณารันด้วยตนเอง: npx prisma migrate dev\n');
      return false;
    }
  } else {
    console.log('✅ Prisma migrations มีอยู่แล้ว\n');
    return true;
  }
}

// Step 4: Import students
async function importStudents() {
  console.log('📋 Step 4: Import ข้อมูลนักเรียน\n');
  
  const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');
  
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`❌ ไม่พบ SQLite database: ${sqliteDbPath}`);
    return false;
  }
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
        resolve(false);
        return;
      }
      
      console.log('✅ Connected to SQLite database\n');
      
      db.all('SELECT student_id, name, email, password_hash, phone, year_level, role FROM users WHERE role = ? ORDER BY student_id', 
        ['student'], 
        async (err, students) => {
          if (err) {
            console.error('❌ Error fetching students:', err);
            db.close();
            resolve(false);
            return;
          }

          if (!students || students.length === 0) {
            console.log('⚠️  ไม่พบข้อมูลนักเรียนใน SQLite database');
            db.close();
            resolve(false);
            return;
          }

          console.log(`📊 พบ ${students.length} คนใน SQLite database\n`);
          console.log('⏳ กำลัง import ข้อมูลเข้า Supabase...\n');

          let successCount = 0;
          let errorCount = 0;
          let skippedCount = 0;

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
              try {
                const { data: existingUser } = await supabase
                  .from('users')
                  .select('student_id')
                  .eq('student_id', student.student_id)
                  .maybeSingle();

                if (existingUser) {
                  skippedCount++;
                  continue;
                }

                const studentData = {
                  student_id: student.student_id.trim(),
                  name: student.name.trim(),
                  email: student.email ? student.email.trim() : `${student.student_id.trim()}@pim.ac.th`,
                  password_hash: student.password_hash || null,
                  phone: student.phone ? student.phone.trim() : null,
                  role: student.role || 'student',
                  birthdate: null,
                  otp_code: null,
                  otp_expires_at: null,
                };

                if (!studentData.password_hash) {
                  const defaultPassword = 'student123';
                  studentData.password_hash = await bcrypt.hash(defaultPassword, 10);
                }

                studentsToInsert.push(studentData);
              } catch (err) {
                // Skip this student if check fails
              }
            }

            if (studentsToInsert.length > 0) {
              try {
                const { data, error } = await supabase
                  .from('users')
                  .insert(studentsToInsert)
                  .select();

                if (error) {
                  console.error(`   ❌ Error inserting batch ${batchIndex + 1}:`, error.message);
                  errorCount += studentsToInsert.length;
                } else {
                  successCount += studentsToInsert.length;
                  console.log(`   ✅ Batch ${batchIndex + 1} complete: +${studentsToInsert.length} created`);
                }
              } catch (err) {
                console.error(`   ❌ Error inserting batch ${batchIndex + 1}:`, err.message);
                errorCount += studentsToInsert.length;
              }
            } else {
              console.log(`   ⏭️  Batch ${batchIndex + 1}: All students already exist, skipped`);
            }

            const totalProcessed = successCount + skippedCount + errorCount;
            const percentage = ((totalProcessed / students.length) * 100).toFixed(1);
            if (batchIndex % 10 === 0 || batchIndex === batches.length - 1) {
              console.log(`   📊 Progress: ${totalProcessed}/${students.length} (${percentage}%)\n`);
            }
          }

          console.log('='.repeat(70));
          console.log('\n📊 สรุปผลการ Import:\n');
          console.log(`   ✅ Import สำเร็จ: ${successCount} คน`);
          console.log(`   ⏭️  ข้าม (มีอยู่แล้ว): ${skippedCount} คน`);
          console.log(`   ❌ เกิดข้อผิดพลาด: ${errorCount} คน`);
          console.log(`   📋 รวมทั้งหมด: ${students.length} คน\n`);

          // Verify final count
          try {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'student');

            console.log(`✅ จำนวนนักเรียนใน Supabase: ${count} คน\n`);
          } catch (err) {
            console.error('⚠️  ไม่สามารถตรวจสอบจำนวนนักเรียนได้:', err.message);
          }

          db.close();
          resolve(true);
        }
      );
    });
  });
}

// Main execution
async function main() {
  try {
    // Step 1: Already checked credentials above
    
    // Step 2: Verify connection
    const isConnected = await verifyConnection();
    if (!isConnected) {
      console.error('\n❌ ไม่สามารถดำเนินการต่อได้ กรุณาแก้ไขปัญหาและลองอีกครั้ง\n');
      process.exit(1);
    }
    
    // Step 3: Check migrations
    const migrationsOk = await checkMigrations();
    if (!migrationsOk) {
      console.error('\n❌ ไม่สามารถดำเนินการต่อได้ กรุณาแก้ไขปัญหาและลองอีกครั้ง\n');
      process.exit(1);
    }
    
    // Step 4: Import students
    const importOk = await importStudents();
    if (!importOk) {
      console.error('\n❌ Import ไม่สำเร็จ กรุณาตรวจสอบและลองอีกครั้ง\n');
      process.exit(1);
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 Setup และ Import เสร็จสมบูรณ์!\n');
    console.log('✅ ระบบพร้อมใช้งานแล้ว\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Start
setTimeout(() => {
  main();
}, 500);

