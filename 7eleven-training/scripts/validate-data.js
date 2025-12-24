const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('\n🔍 ตรวจสอบความถูกต้องของข้อมูล SQLite\n');
console.log('='.repeat(70));

const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');

if (!fs.existsSync(sqliteDbPath)) {
  console.error(`❌ ไม่พบ SQLite database: ${sqliteDbPath}`);
  process.exit(1);
}

const db = new sqlite3.Database(sqliteDbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database\n');
  
  // Check 1: Count students
  db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, row) => {
    if (err) {
      console.error('❌ Error counting students:', err);
      db.close();
      return;
    }
    
    console.log(`📊 จำนวนนักเรียนทั้งหมด: ${row.count} คน\n`);
    
    // Check 2: Check for missing data
    db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END) as missing_name,
        SUM(CASE WHEN student_id IS NULL OR student_id = '' THEN 1 ELSE 0 END) as missing_id,
        SUM(CASE WHEN email IS NULL OR email = '' THEN 1 ELSE 0 END) as missing_email
      FROM users 
      WHERE role = 'student'
    `, (err, rows) => {
      if (err) {
        console.error('❌ Error checking data quality:', err);
        db.close();
        return;
      }
      
      const stats = rows[0];
      console.log('📋 คุณภาพข้อมูล:\n');
      console.log(`   ✅ Total: ${stats.total} คน`);
      console.log(`   ${stats.missing_name > 0 ? '❌' : '✅'} Missing name: ${stats.missing_name} คน`);
      console.log(`   ${stats.missing_id > 0 ? '❌' : '✅'} Missing student_id: ${stats.missing_id} คน`);
      console.log(`   ${stats.missing_email > 0 ? '⚠️ ' : '✅'} Missing email: ${stats.missing_email} คน\n`);
      
      // Check 3: Check for duplicate student_id
      db.all(`
        SELECT student_id, COUNT(*) as count
        FROM users
        WHERE role = 'student'
        GROUP BY student_id
        HAVING COUNT(*) > 1
      `, (err, duplicates) => {
        if (err) {
          console.error('❌ Error checking duplicates:', err);
          db.close();
          return;
        }
        
        if (duplicates.length > 0) {
          console.log(`⚠️  พบ student_id ซ้ำ: ${duplicates.length} รายการ\n`);
          duplicates.slice(0, 5).forEach(dup => {
            console.log(`   - ${dup.student_id}: ${dup.count} ครั้ง`);
          });
          if (duplicates.length > 5) {
            console.log(`   ... และอีก ${duplicates.length - 5} รายการ\n`);
          }
        } else {
          console.log('✅ ไม่พบ student_id ซ้ำ\n');
        }
        
        // Check 4: Check student_id format
        db.all(`
          SELECT student_id, name
          FROM users
          WHERE role = 'student'
          AND (student_id IS NULL OR student_id = '' OR LENGTH(student_id) < 4 OR LENGTH(student_id) > 20)
          LIMIT 10
        `, (err, invalidIds) => {
          if (err) {
            console.error('❌ Error checking student_id format:', err);
            db.close();
            return;
          }
          
          if (invalidIds.length > 0) {
            console.log(`⚠️  พบ student_id ที่ format ไม่ถูกต้อง: ${invalidIds.length} รายการ\n`);
            invalidIds.forEach(inv => {
              console.log(`   - ${inv.student_id || '(NULL)'}: ${inv.name || '(ไม่มีชื่อ)'}`);
            });
            console.log();
          } else {
            console.log('✅ ทุก student_id มี format ถูกต้อง\n');
          }
          
          // Check 5: Sample data
          db.all(`
            SELECT student_id, name, email, phone
            FROM users
            WHERE role = 'student'
            LIMIT 5
          `, (err, samples) => {
            if (err) {
              console.error('❌ Error getting samples:', err);
              db.close();
              return;
            }
            
            console.log('📝 ตัวอย่างข้อมูล (5 รายการแรก):\n');
            samples.forEach((student, index) => {
              console.log(`   ${index + 1}. ${student.student_id} - ${student.name}`);
              console.log(`      Email: ${student.email || '(ไม่มี)'}`);
              console.log(`      Phone: ${student.phone || '(ไม่มี)'}\n`);
            });
            
            console.log('='.repeat(70));
            console.log('\n✅ ตรวจสอบข้อมูลเสร็จสมบูรณ์!\n');
            
            // Summary
            const hasIssues = stats.missing_name > 0 || stats.missing_id > 0 || duplicates.length > 0 || invalidIds.length > 0;
            
            if (hasIssues) {
              console.log('⚠️  พบปัญหาบางอย่างในข้อมูล');
              console.log('💡 แนะนำให้แก้ไขข้อมูลใน SQLite ก่อน import\n');
            } else {
              console.log('🎉 ข้อมูลพร้อมสำหรับ import!\n');
            }
            
            db.close();
          });
        });
      });
    });
  });
});

