const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node read-excel-info.js <file_path>');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

try {
  console.log(`\nReading file: ${path.basename(filePath)}...`);
  const workbook = XLSX.readFile(filePath);
  
  console.log(`\n📋 Excel Structure Summary:`);
  console.log(`================================================================================`);
  console.log(`Sheets in workbook: ${workbook.SheetNames.join(', ')}`);
  
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length === 0) {
      console.log(`\nSheet: ${sheetName} (Empty)`);
      return;
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    console.log(`\nSheet: ${sheetName}`);
    console.log(`- Total Rows (including header): ${data.length}`);
    console.log(`- Columns: ${headers.length}`);
    console.log(`- Headers: ${headers.join(' | ')}`);
    
    // Show first 3 data rows as preview
    if (rows.length > 0) {
      console.log(`- Data Preview (First 3 rows):`);
      rows.slice(0, 3).forEach((row, idx) => {
        console.log(`  Row ${idx + 1}: ${row.join(' | ')}`);
      });
    }
  });
  console.log(`\n================================================================================`);

} catch (error) {
  console.error(`❌ Error reading Excel file: ${error.message}`);
}

