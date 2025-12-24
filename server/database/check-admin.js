const db = require('./init');

// Check admin accounts
db.all('SELECT student_id, name, role, email FROM users WHERE role = ? OR role = ?', ['admin', 'instructor'], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('📋 บัญชี Admin/Instructor:');
  if (rows.length === 0) {
    console.log('  ⚠️  ไม่พบบัญชี Admin/Instructor');
    console.log('\n💡 บัญชีเริ่มต้น:');
    console.log('  - Admin: ADMIN001 / admin123');
  } else {
    rows.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.student_id} - ${r.name} (${r.role})`);
    });
  }
  
  db.close();
});

