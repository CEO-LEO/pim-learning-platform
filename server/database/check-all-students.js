const db = require('./init');

console.log('\n📊 สรุปข้อมูลนักศึกษาในระบบ\n');
console.log('='.repeat(70));

// Check users table
db.all('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  const userCount = rows[0].count;
  console.log(`\n👥 จำนวน User Accounts (ในตาราง users): ${userCount} คน`);

  // Check whitelist table
  db.all('SELECT COUNT(*) as count FROM student_whitelist', [], (err2, rows2) => {
    if (err2) {
      console.error('Error:', err2);
      db.close();
      return;
    }
    const whitelistCount = rows2[0].count;
    console.log(`📋 จำนวนใน Whitelist Table: ${whitelistCount} คน`);
    
    const diff = whitelistCount - userCount;
    console.log(`\n📊 ผลต่าง: ${diff} คน`);
    
    if (diff > 0) {
      console.log(`\n⚠️  มี ${diff} คนใน whitelist ที่ยังไม่มี user account!\n`);
      
      // Show students in whitelist but not in users
      db.all(`
        SELECT sw.student_id, sw.name, sw.phone 
        FROM student_whitelist sw
        LEFT JOIN users u ON sw.student_id = u.student_id
        WHERE u.student_id IS NULL
        ORDER BY sw.student_id
        LIMIT 20
      `, [], (err3, rows3) => {
        if (!err3 && rows3.length > 0) {
          console.log('📝 ตัวอย่างรหัสนักศึกษาที่ยังไม่มี account (20 รายการแรก):\n');
          rows3.forEach((r, i) => {
            console.log(`   ${String(i + 1).padStart(3, ' ')}. ${r.student_id.padEnd(15, ' ')} - ${r.name.padEnd(35, ' ')} (${r.phone || 'ไม่มีเบอร์'})`);
          });
          if (diff > 20) {
            console.log(`\n   ... และอีก ${diff - 20} คน\n`);
          }
        }
        
        // Show total count
        console.log('\n' + '='.repeat(70));
        console.log(`\n✅ สรุป: มี ${whitelistCount} คนใน whitelist แต่มีแค่ ${userCount} คนที่มี user account`);
        console.log(`   ต้องการสร้าง user account เพิ่มอีก ${diff} คน\n`);
        
        db.close();
      });
    } else {
      console.log('\n✅ ทุกคนใน whitelist มี user account แล้ว\n');
      db.close();
    }
  });
});

