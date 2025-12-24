const db = require('./init');

// Check total students
db.all('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('📊 จำนวนนักเรียนในระบบ:', rows[0].count, 'คน');
  
  // Check whitelisted students
  db.all('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_whitelisted = 1', ['student'], (err2, rows2) => {
    if (err2) {
      console.error('Error:', err2);
      return;
    }
    console.log('✅ จำนวนนักเรียนที่ Whitelisted:', rows2[0].count, 'คน');
    
    // Check whitelist table
    db.all('SELECT COUNT(*) as count FROM student_whitelist', [], (err3, rows3) => {
      if (err3) {
        console.error('Error:', err3);
        return;
      }
      console.log('📋 จำนวนนักเรียนใน Whitelist Table:', rows3[0].count, 'คน');
      
      // List all students
      db.all('SELECT student_id, name, is_whitelisted FROM users WHERE role = ? ORDER BY student_id', ['student'], (err4, rows4) => {
        if (err4) {
          console.error('Error:', err4);
          db.close();
          return;
        }
        
        if (rows4.length > 0) {
          console.log('\n📝 รายชื่อนักเรียนทั้งหมด:');
          rows4.forEach((r, i) => {
            const status = r.is_whitelisted === 1 ? '✅' : '❌';
            console.log(`${i + 1}. ${status} ${r.student_id} - ${r.name}`);
          });
        } else {
          console.log('\n⚠️  ยังไม่มีนักเรียนในระบบ');
        }
        
        db.close();
      });
    });
  });
});

