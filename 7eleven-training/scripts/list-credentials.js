const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('\n🔐 รายการรหัสนักศึกษาและรหัสผ่าน\n');
console.log('='.repeat(70));

const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');

if (!fs.existsSync(sqliteDbPath)) {
  console.error(`❌ ไม่พบ SQLite database: ${sqliteDbPath}`);
  process.exit(1);
}

// Get limit from command line argument or default to 20
const args = process.argv.slice(2);
const limit = args[0] ? Math.min(parseInt(args[0]) || 20, 50) : 20;

const db = new sqlite3.Database(sqliteDbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to SQLite database\n');
  
  // Get total count
  db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, row) => {
    if (err) {
      console.error('❌ Error counting students:', err);
      db.close();
      return;
    }
    
    const totalCount = row.count;
    console.log(`📊 จำนวนนักเรียนทั้งหมด: ${totalCount} คน`);
    console.log(`📋 แสดง ${limit} รายการแรก\n`);
    console.log('='.repeat(70));
    
    // Get students
    db.all(`
      SELECT student_id, name, email, password_hash, phone
      FROM users
      WHERE role = 'student'
      ORDER BY student_id
      LIMIT ?
    `, [limit], (err, students) => {
      if (err) {
        console.error('❌ Error fetching students:', err);
        db.close();
        return;
      }
      
      console.log('\n📝 รายการรหัสนักศึกษาและรหัสผ่าน:\n');
      
      students.forEach((student, index) => {
        console.log(`${index + 1}. รหัสนักศึกษา: ${student.student_id}`);
        console.log(`   ชื่อ: ${student.name}`);
        console.log(`   Email: ${student.email || '(ไม่มี)'}`);
        console.log(`   Phone: ${student.phone || '(ไม่มี)'}`);
        
        if (student.password_hash) {
          console.log(`   รหัสผ่าน: มีอยู่ในระบบ (hashed)`);
          console.log(`   💡 รหัสผ่านเริ่มต้นสำหรับ import: student123`);
        } else {
          console.log(`   รหัสผ่าน: ไม่มี (จะใช้รหัสผ่านเริ่มต้น: student123)`);
        }
        console.log();
      });
      
      console.log('='.repeat(70));
      console.log(`\n📊 แสดง ${students.length} จาก ${totalCount} คน\n`);
      
      if (totalCount > limit) {
        console.log('💡 ต้องการดูเพิ่มเติม?');
        console.log(`   npm run list-credentials ${limit + 20}`);
        console.log('   หรือใช้ SQLite browser เพื่อดูข้อมูลทั้งหมด\n');
      }
      
      console.log('🔐 ข้อมูลรหัสผ่าน:');
      console.log('   - รหัสผ่านที่ hash แล้วจะถูกใช้ถ้ามี');
      console.log('   - ถ้าไม่มีรหัสผ่าน จะใช้รหัสผ่านเริ่มต้น: student123');
      console.log('   - รหัสผ่านเริ่มต้นจะถูก hash เมื่อ import เข้า Supabase\n');
      
      // Export to CSV
      const csvPath = path.join(__dirname, '../student-credentials.csv');
      let csv = 'รหัสนักศึกษา,ชื่อ,Email,Phone,รหัสผ่าน\n';
      
      students.forEach(student => {
        const password = student.password_hash ? 'student123 (hashed in DB)' : 'student123';
        csv += `"${student.student_id}","${student.name}","${student.email || ''}","${student.phone || ''}","${password}"\n`;
      });
      
      fs.writeFileSync(csvPath, csv, 'utf8');
      console.log(`✅ บันทึกไฟล์ CSV เรียบร้อย: ${csvPath}`);
      console.log(`📊 บันทึก ${students.length} รายการ\n`);
      
      db.close();
    });
  });
});
