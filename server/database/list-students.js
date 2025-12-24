const db = require('./init');

console.log('\n📋 รายชื่อรหัสนักศึกษาในระบบ\n');
console.log('='.repeat(60));

// List all students
db.all('SELECT student_id, name, email, role, is_whitelisted FROM users WHERE role = ? ORDER BY student_id', ['student'], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  if (rows.length > 0) {
    console.log(`\nพบ ${rows.length} คน:\n`);
    rows.forEach((r, i) => {
      const status = r.is_whitelisted === 1 ? '✅' : '❌';
      const email = r.email || 'ไม่มีอีเมล';
      console.log(`${String(i + 1).padStart(3, ' ')}. ${status} ${r.student_id.padEnd(15, ' ')} - ${r.name.padEnd(30, ' ')} (${email})`);
    });
    console.log('\n' + '='.repeat(60));
    console.log(`\nรวมทั้งหมด: ${rows.length} คน\n`);
  } else {
    console.log('\n⚠️  ยังไม่มีนักเรียนในระบบ\n');
  }
  
  // Also check whitelist table
  db.all('SELECT student_id, name FROM student_whitelist ORDER BY student_id LIMIT 10', [], (err2, rows2) => {
    if (!err2 && rows2.length > 0) {
      console.log('\n📝 ตัวอย่างรหัสนักศึกษาใน Whitelist (10 รายการแรก):\n');
      rows2.forEach((r, i) => {
        console.log(`   ${String(i + 1).padStart(3, ' ')}. ${r.student_id.padEnd(15, ' ')} - ${r.name}`);
      });
      console.log('');
    }
    db.close();
  });
});

