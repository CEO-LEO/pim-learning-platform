const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Import students from whitelist
 * This script creates user accounts for students in the whitelist
 * Default password for all students: student_id (their student ID)
 */

// Student data from the report
// Format: { student_id, name, phone }
const students = [
  { student_id: '8840000028', name: 'นางสาวศิลารัตน์ เชิงหอม', phone: '0820862960' },
  { student_id: '5840000036', name: 'นายจารุกิตต์ ปาเกษม', phone: '0947026401' },
  { student_id: '6840000044', name: 'นางสาวอริศรา ภิรมย์สุวรรณ', phone: '0962563882' },
  // Add more students here based on the report
  // You can extract the data from Excel/CSV and format it like above
];

async function importStudents() {
  console.log('📥 Starting student import...');
  console.log(`📋 Total students to import: ${students.length}`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    try {
      // Check if student already exists
      db.get('SELECT * FROM users WHERE student_id = ?', [student.student_id], async (err, existingUser) => {
        if (err) {
          console.error(`❌ Error checking student ${student.student_id}:`, err.message);
          errorCount++;
          return;
        }

        if (existingUser) {
          console.log(`⏭️  Student ${student.student_id} already exists, skipping...`);
          skippedCount++;
          return;
        }

        // Create user with default password = student_id
        const defaultPassword = student.student_id;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const userId = uuidv4();

        // Extract year level from student_id (first digit: 8=year 4, 5=year 3, 6=year 2, etc.)
        const firstDigit = parseInt(student.student_id.charAt(0));
        let yearLevel = 1;
        if (firstDigit === 8) yearLevel = 4;
        else if (firstDigit === 7) yearLevel = 3;
        else if (firstDigit === 6) yearLevel = 2;
        else if (firstDigit === 5) yearLevel = 1;

        db.run(
          'INSERT INTO users (user_id, student_id, name, email, password_hash, year_level, role, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            student.student_id,
            student.name,
            `${student.student_id}@pim.ac.th`,
            passwordHash,
            yearLevel,
            'student',
            student.phone || null
          ],
          function(insertErr) {
            if (insertErr) {
              console.error(`❌ Error importing student ${student.student_id}:`, insertErr.message);
              errorCount++;
            } else {
              console.log(`✅ Imported: ${student.student_id} - ${student.name}`);
              successCount++;
            }
          }
        );
      });
    } catch (error) {
      console.error(`❌ Error processing student ${student.student_id}:`, error.message);
      errorCount++;
    }
  }

  // Wait a bit for async operations to complete
  setTimeout(() => {
    console.log('\n📊 Import Summary:');
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n💡 Default password for all students is their student_id');
    process.exit(0);
  }, 2000);
}

// Run import
importStudents();

module.exports = { importStudents };

