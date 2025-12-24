const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

console.log('\n🚀 เริ่มสร้าง User Accounts สำหรับทุกคนใน Whitelist\n');
console.log('='.repeat(70));

// Default password for all students
const DEFAULT_PASSWORD = 'student123';

async function createAllUsers() {
  try {
    // Get all students from whitelist that don't have user accounts
    db.all(`
      SELECT sw.student_id, sw.name, sw.phone 
      FROM student_whitelist sw
      LEFT JOIN users u ON sw.student_id = u.student_id
      WHERE u.student_id IS NULL
      ORDER BY sw.student_id
    `, [], async (err, students) => {
      if (err) {
        console.error('❌ Error fetching students:', err);
        db.close();
        return;
      }

      if (!students || students.length === 0) {
        console.log('✅ ทุกคนใน whitelist มี user account แล้ว!');
        db.close();
        return;
      }

      console.log(`\n📋 พบ ${students.length} คนที่ยังไม่มี user account\n`);
      console.log('⏳ กำลังสร้าง user accounts...\n');

      const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      let created = 0;
      let skipped = 0;
      let errors = 0;

      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < students.length; i += batchSize) {
        batches.push(students.slice(i, i + batchSize));
      }

      let currentBatch = 0;

      function processBatch(batch) {
        return new Promise((resolve) => {
          let completed = 0;
          let batchCreated = 0;
          let batchSkipped = 0;
          let batchErrors = 0;

          if (batch.length === 0) {
            resolve({ created: 0, skipped: 0, errors: 0 });
            return;
          }

          batch.forEach((student) => {
            const userId = uuidv4();
            const studentId = student.student_id.trim();
            const name = student.name.trim();
            const phone = student.phone ? student.phone.trim() : null;
            const email = `${studentId}@pim.ac.th`;

            // Determine year level from student_id
            let yearLevel = 1;
            const firstDigit = parseInt(studentId.charAt(0));
            if (firstDigit === 8) yearLevel = 4;
            else if (firstDigit === 7) yearLevel = 3;
            else if (firstDigit === 6) yearLevel = 2;
            else if (firstDigit === 5) yearLevel = 1;

            db.run(
              `INSERT INTO users (user_id, student_id, name, email, password_hash, year_level, role, phone, is_whitelisted) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [userId, studentId, name, email, defaultPasswordHash, yearLevel, 'student', phone, 1],
              function(insertErr) {
                completed++;
                
                if (insertErr) {
                  if (insertErr.message.includes('UNIQUE constraint')) {
                    batchSkipped++;
                  } else {
                    batchErrors++;
                    console.error(`   ❌ Error creating ${studentId}: ${insertErr.message}`);
                  }
                } else {
                  batchCreated++;
                }

                if (completed === batch.length) {
                  resolve({ created: batchCreated, skipped: batchSkipped, errors: batchErrors });
                }
              }
            );
          });
        });
      }

      async function processAllBatches() {
        for (let i = 0; i < batches.length; i++) {
          currentBatch = i + 1;
          const batch = batches[i];
          console.log(`   📦 Processing batch ${currentBatch}/${batches.length} (${batch.length} students)...`);
          
          const result = await processBatch(batch);
          created += result.created;
          skipped += result.skipped;
          errors += result.errors;

          // Show progress
          const totalProcessed = created + skipped + errors;
          const percentage = ((totalProcessed / students.length) * 100).toFixed(1);
          console.log(`   ✅ Batch ${currentBatch} complete: +${result.created} created, ${result.skipped} skipped, ${result.errors} errors (${percentage}% total)`);
        }

        // Final summary
        console.log('\n' + '='.repeat(70));
        console.log('\n📊 สรุปผลการสร้าง User Accounts:\n');
        console.log(`   ✅ สร้างสำเร็จ: ${created} คน`);
        console.log(`   ⏭️  ข้าม (มีอยู่แล้ว): ${skipped} คน`);
        console.log(`   ❌ เกิดข้อผิดพลาด: ${errors} คน`);
        console.log(`   📋 รวมทั้งหมด: ${students.length} คน\n`);
        console.log(`\n🔑 รหัสผ่านเริ่มต้นสำหรับทุกคน: "${DEFAULT_PASSWORD}"`);
        console.log('   (แนะนำให้เปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก)\n');

        db.close();
      }

      processAllBatches();
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    db.close();
  }
}

// Start the process
setTimeout(() => {
  createAllUsers();
}, 1000);

