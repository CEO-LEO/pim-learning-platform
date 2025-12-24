const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

/**
 * Bulk import students from CSV file
 * CSV format: student_id,name,phone,gpax,advisor
 * Example: 8840000028,นางสาวศิลารัตน์ เชิงหอม,0820862960,3.18,ผู้ช่วยศาสตราจารย์สิทธิพัทธ์ เลิศศรีชัยนนท์
 */

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const students = [];
  
  // Skip header if exists
  const startIndex = lines[0].includes('student_id') || lines[0].includes('รหัส') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim());
    
    if (fields.length >= 2) {
      students.push({
        student_id: fields[0].trim(),
        name: fields[1].trim(),
        phone: fields[2] ? fields[2].trim() : null,
        gpax: fields[3] ? parseFloat(fields[3].trim()) : null,
        advisor: fields[4] ? fields[4].trim() : null
      });
    }
  }
  
  return students;
}

async function bulkImportStudents(csvFilePath) {
  console.log('📥 Starting bulk student import...');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    console.log('\n💡 Create a CSV file with the following format:');
    console.log('student_id,name,phone,gpax,advisor');
    console.log('8840000028,นางสาวศิลารัตน์ เชิงหอม,0820862960,3.18,ผู้ช่วยศาสตราจารย์สิทธิพัทธ์ เลิศศรีชัยนนท์');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const students = parseCSV(csvContent);
  
  console.log(`📋 Found ${students.length} students in CSV file`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  let whitelistCount = 0;
  
  // Remove duplicates by student_id (keep first occurrence)
  const uniqueStudents = [];
  const seenIds = new Set();
  for (const student of students) {
    if (!seenIds.has(student.student_id)) {
      seenIds.add(student.student_id);
      uniqueStudents.push(student);
    } else {
      console.log(`⚠️  Skipping duplicate student_id: ${student.student_id} - ${student.name}`);
    }
  }
  
  console.log(`📋 After removing duplicates: ${uniqueStudents.length} unique students`);
  
  for (const student of uniqueStudents) {
    try {
      // Add to whitelist table
      db.run(
        'INSERT OR REPLACE INTO student_whitelist (student_id, name, phone, gpax, advisor) VALUES (?, ?, ?, ?, ?)',
        [student.student_id, student.name, student.phone, student.gpax, student.advisor],
        (err) => {
          if (err) {
            console.error(`❌ Error adding to whitelist ${student.student_id}:`, err.message);
          } else {
            whitelistCount++;
          }
        }
      );
      
      // Check if user already exists
      db.get('SELECT * FROM users WHERE student_id = ?', [student.student_id], async (err, existingUser) => {
        if (err) {
          console.error(`❌ Error checking student ${student.student_id}:`, err.message);
          errorCount++;
          return;
        }
        
        if (existingUser) {
          // Update existing user to be whitelisted (only update if not already whitelisted)
          if (existingUser.is_whitelisted !== 1) {
            db.run(
              'UPDATE users SET is_whitelisted = 1, name = ?, phone = ? WHERE student_id = ?',
              [student.name, student.phone, student.student_id],
              (updateErr) => {
                if (updateErr) {
                  console.error(`❌ Error updating student ${student.student_id}:`, updateErr.message);
                  errorCount++;
                } else {
                  console.log(`🔄 Updated: ${student.student_id} - ${student.name}`);
                  successCount++;
                }
              }
            );
          } else {
            // Already whitelisted, just update whitelist table
            console.log(`⏭️  Already whitelisted: ${student.student_id} - ${student.name}`);
            skippedCount++;
          }
          return;
        }
        
        // Create new user with default password = student_id
        const defaultPassword = student.student_id;
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        const userId = uuidv4();
        
        // Extract year level from student_id (first digit)
        const firstDigit = parseInt(student.student_id.charAt(0));
        let yearLevel = 1;
        if (firstDigit === 8) yearLevel = 4;
        else if (firstDigit === 7) yearLevel = 3;
        else if (firstDigit === 6) yearLevel = 2;
        else if (firstDigit === 5) yearLevel = 1;
        
        db.run(
          'INSERT INTO users (user_id, student_id, name, email, password_hash, year_level, role, phone, is_whitelisted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userId,
            student.student_id,
            student.name,
            `${student.student_id}@pim.ac.th`,
            passwordHash,
            yearLevel,
            'student',
            student.phone || null,
            1 // is_whitelisted
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
  
  // Wait for async operations to complete
  setTimeout(() => {
    console.log('\n📊 Import Summary:');
    console.log(`✅ Users created/updated: ${successCount}`);
    console.log(`📋 Whitelist entries: ${whitelistCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\n💡 Default password for all students is their student_id');
    console.log('🔒 Only whitelisted students can login to the system');
    process.exit(0);
  }, 3000);
}

// Get CSV file path from command line argument
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log('📥 Bulk Student Import Tool');
  console.log('\nUsage:');
  console.log('  node bulk-import-students.js <path-to-csv-file>');
  console.log('\nCSV Format:');
  console.log('  student_id,name,phone,gpax,advisor');
  console.log('  8840000028,นางสาวศิลารัตน์ เชิงหอม,0820862960,3.18,ผู้ช่วยศาสตราจารย์สิทธิพัทธ์ เลิศศรีชัยนนท์');
  console.log('\nExample:');
  console.log('  node bulk-import-students.js students.csv');
  process.exit(1);
}

bulkImportStudents(csvFilePath);

module.exports = { bulkImportStudents, parseCSV };

