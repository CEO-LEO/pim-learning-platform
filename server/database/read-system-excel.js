const XLSX = require('xlsx');
const path = require('path');

const excelPath = 'C:\\PIMX\\ระบบการเข้าอบรม 7-Eleven Demonstation Store.xlsx';

console.log('📋 Reading Excel file: ระบบการเข้าอบรม 7-Eleven Demonstration Store.xlsx\n');

try {
  const workbook = XLSX.readFile(excelPath);
  
  console.log(`📑 Total Sheets: ${workbook.SheetNames.length}\n`);
  
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sheet ${index + 1}: ${sheetName}`);
    console.log('='.repeat(60));
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    console.log(`📊 Rows: ${data.length}`);
    
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`📋 Columns (${columns.length}): ${columns.join(', ')}`);
      
      console.log('\n📝 First 3 rows sample:');
      data.slice(0, 3).forEach((row, i) => {
        console.log(`\nRow ${i + 1}:`);
        Object.keys(row).slice(0, 10).forEach(key => {
          const value = row[key];
          if (value !== null && value !== undefined) {
            const displayValue = String(value).length > 50 
              ? String(value).substring(0, 50) + '...' 
              : String(value);
            console.log(`  ${key}: ${displayValue}`);
          }
        });
      });
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Excel file read successfully');
  
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  process.exit(1);
}

