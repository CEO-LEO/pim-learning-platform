const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Add new user
const studentId = process.argv[2] || '65011216007';
const password = process.argv[3] || 'student123';
const name = process.argv[4] || 'นักศึกษา';

bcrypt.hash(password, 10, (err, passwordHash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }

  const userId = uuidv4();
  db.run(
    'INSERT OR IGNORE INTO users (user_id, student_id, name, email, password_hash, year_level, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, studentId, name, `${studentId}@pim.ac.th`, passwordHash, 1, 'student'],
    function(err) {
      if (err) {
        console.error('Error creating user:', err);
        process.exit(1);
      }
      if (this.changes > 0) {
        console.log(`✅ User created successfully!`);
        console.log(`   Student ID: ${studentId}`);
        console.log(`   Password: ${password}`);
      } else {
        console.log(`ℹ️  User ${studentId} already exists`);
      }
      process.exit(0);
    }
  );
});

