const XLSX = require('xlsx');
const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

/**
 * Import students from Excel file
 * Supports .xlsx files
 * Expected columns: รหัส (student_id), ชื่อ-นามสกุล (name), เบอร์โทรศัพท์ (phone), GPAX (gpax), อาจารย์ที่ปรึกษา (advisor)
 */

async function importFromExcel(excelFilePath) {
  console.log('📥 Starting Excel import...');
  
  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ File not found: ${excelFilePath}`);
    console.log('\n💡 Please provide the path to your Excel file');
    console.log('Example: node import-excel.js "C:\\path\\to\\ฐานข้อมูลนักศึกษา.xlsx"');
    process.exit(1);
  }
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (skip first row as it's usually header)
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`📋 Found ${data.length} rows in Excel file`);
    
    if (data.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }
    
    // Show first row to understand structure (for debugging)
    if (data.length > 0) {
      console.log('\n📊 First data row structure:');
      const firstDataRow = data.find(row => {
        const keys = Object.keys(row);
        const studentIdKey = keys.find(k => k === '__EMPTY_2' || k.toLowerCase().includes('รหัส') || k.toLowerCase().includes('id'));
        if (studentIdKey) {
          const studentId = String(row[studentIdKey] || '').trim();
          return studentId && /^\d{8,10}$/.test(studentId);
        }
        return false;
      });
      if (firstDataRow) {
        console.log(JSON.stringify(firstDataRow, null, 2));
      }
    }
    
    // Map Excel columns to our format
    const students = [];
    const seenIds = new Set();
    
    // Try to detect column structure from first row
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    // Detect if using __EMPTY_* format (Excel without headers)
    const isEmptyFormat = keys.some(k => k.startsWith('__EMPTY'));
    
    let studentIdCol = null;
    let nameCol = null;
    let phoneCol = null;
    let gpaxCol = null;
    let advisorCol = null;
    
    if (isEmptyFormat) {
      // Map based on typical Excel structure: __EMPTY_2 = รหัส, __EMPTY_3 = ชื่อ, etc.
      studentIdCol = '__EMPTY_2';
      nameCol = '__EMPTY_3';
      phoneCol = '__EMPTY_11'; // Usually first phone column
      gpaxCol = '__EMPTY_7';
      advisorCol = '__EMPTY_8';
    } else {
      // Find columns by name
      for (const key of keys) {
        const lowerKey = key.toLowerCase().trim();
        if (!studentIdCol && (lowerKey.includes('รหัส') || lowerKey.includes('student_id') || lowerKey.includes('id'))) {
          studentIdCol = key;
        }
        if (!nameCol && (lowerKey.includes('ชื่อ') || lowerKey.includes('name') || lowerKey.includes('นาม'))) {
          nameCol = key;
        }
        if (!phoneCol && (lowerKey.includes('โทร') || lowerKey.includes('phone') || lowerKey.includes('เบอร์'))) {
          phoneCol = key;
        }
        if (!gpaxCol && (lowerKey.includes('gpax') || lowerKey.includes('เกรด') || lowerKey.includes('grade'))) {
          gpaxCol = key;
        }
        if (!advisorCol && (lowerKey.includes('อาจารย์') || lowerKey.includes('advisor') || lowerKey.includes('ที่ปรึกษา'))) {
          advisorCol = key;
        }
      }
    }
    
    console.log(`\n📊 Detected column structure:`);
    console.log(`  Student ID: ${studentIdCol || 'NOT FOUND'}`);
    console.log(`  Name: ${nameCol || 'NOT FOUND'}`);
    console.log(`  Phone: ${phoneCol || 'NOT FOUND'}`);
    console.log(`  GPAX: ${gpaxCol || 'NOT FOUND'}`);
    console.log(`  Advisor: ${advisorCol || 'NOT FOUND'}`);
    
    if (!studentIdCol || !nameCol) {
      console.error('\n❌ Cannot find required columns (รหัส/student_id and ชื่อ/name)');
      console.log('\nFirst row structure:');
      console.log(JSON.stringify(firstRow, null, 2));
      process.exit(1);
    }
    
    for (const row of data) {
      let studentId = studentIdCol ? String(row[studentIdCol] || '').trim() : null;
      let name = nameCol ? String(row[nameCol] || '').trim() : null;
      let phone = phoneCol ? String(row[phoneCol] || '').trim() : null;
      let gpax = gpaxCol ? (row[gpaxCol] ? parseFloat(row[gpaxCol]) : null) : null;
      let advisor = advisorCol ? String(row[advisorCol] || '').trim() : null;
      
      // Validate student_id - must be numeric and 8-10 digits
      if (!studentId || studentId.length < 8 || !/^\d+$/.test(studentId)) {
        // Skip header/footer rows
        continue;
      }
      
      // Skip duplicates
      if (seenIds.has(studentId)) {
        console.log(`⚠️  Skipping duplicate student_id: ${studentId}`);
        continue;
      }
      seenIds.add(studentId);
      
      students.push({
        student_id: studentId,
        name: name || 'ไม่ระบุชื่อ',
        phone: phone && phone !== 'null' && phone !== 'undefined' ? phone : null,
        gpax: gpax && !isNaN(gpax) ? gpax : null,
        advisor: advisor && advisor !== 'null' && advisor !== 'undefined' ? advisor : null
      });
    }
    
    console.log(`\n📋 After processing: ${students.length} unique students`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let whitelistCount = 0;
    
    for (const student of students) {
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
            // Update existing user to be whitelisted
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
    // Since we have many students, wait longer
    const totalStudents = students.length;
    const waitTime = Math.max(5000, totalStudents * 10); // At least 5 seconds, or 10ms per student
    
    setTimeout(() => {
      console.log('\n📊 Import Summary:');
      console.log(`✅ Users created/updated: ${successCount}`);
      console.log(`📋 Whitelist entries: ${whitelistCount}`);
      console.log(`⏭️  Skipped: ${skippedCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      console.log(`📊 Total processed: ${totalStudents} students`);
      console.log('\n💡 Default password for all students is their student_id');
      console.log('🔒 Only whitelisted students can login to the system');
      console.log('\n⚠️  Note: User accounts are created asynchronously.');
      console.log('   If you see 0 users created, wait a moment and run check-students.js again.');
      db.close();
      process.exit(0);
    }, waitTime);
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
    process.exit(1);
  }
}

// Get Excel file path from command line argument
const excelFilePath = process.argv[2];

if (!excelFilePath) {
  console.log('📥 Excel Student Import Tool');
  console.log('\nUsage:');
  console.log('  node import-excel.js <path-to-excel-file>');
  console.log('\nExample:');
  console.log('  node import-excel.js "C:\\Users\\YourName\\Downloads\\ฐานข้อมูลนักศึกษา.xlsx"');
  console.log('  node import-excel.js "ฐานข้อมูลนักศึกษา.xlsx"');
  console.log('\nExpected Excel columns:');
  console.log('  - รหัส / student_id / รหัสนักศึกษา');
  console.log('  - ชื่อ / name / ชื่อ-นามสกุล');
  console.log('  - เบอร์โทรศัพท์ / phone / โทรศัพท์');
  console.log('  - GPAX / เกรด / grade');
  console.log('  - อาจารย์ที่ปรึกษา / advisor / ที่ปรึกษา');
  process.exit(1);
}

importFromExcel(excelFilePath);

module.exports = { importFromExcel };

