const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function createInstructor() {
  console.log('🔧 กำลังสร้างบัญชี Instructor...\n');

  // Check if instructor already exists
  db.get('SELECT * FROM users WHERE student_id = ?', ['INST001'], async (err, existing) => {
    if (err) {
      console.error('❌ Error:', err);
      db.close();
      return;
    }

    if (existing) {
      console.log('⚠️  บัญชี Instructor มีอยู่แล้ว:');
      console.log(`   รหัส: ${existing.student_id}`);
      console.log(`   ชื่อ: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   รหัสผ่าน: instructor123`);
      db.close();
      return;
    }

    // Create instructor account
    const instructorPassword = await bcrypt.hash('instructor123', 10);
    const instructorId = uuidv4();

    db.run(
      'INSERT INTO users (user_id, student_id, name, email, password_hash, role, is_whitelisted) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        instructorId,
        'INST001',
        'อาจารย์ผู้สอน',
        'instructor@pim.ac.th',
        instructorPassword,
        'instructor',
        1
      ],
      function(err) {
        if (err) {
          console.error('❌ Error creating instructor:', err);
          db.close();
          return;
        }

        console.log('✅ สร้างบัญชี Instructor สำเร็จ!\n');
        console.log('📋 ข้อมูลการเข้าสู่ระบบ:');
        console.log('   รหัส: INST001');
        console.log('   รหัสผ่าน: instructor123');
        console.log('   ชื่อ: อาจารย์ผู้สอน');
        console.log('   Role: instructor');
        console.log('\n💡 คุณสามารถใช้รหัสนี้เข้าสู่ระบบได้แล้ว\n');
        
        db.close();
      }
    );
  });
}

createInstructor();

