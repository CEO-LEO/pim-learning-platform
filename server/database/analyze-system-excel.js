const XLSX = require('xlsx');

const excelPath = 'C:\\PIMX\\ระบบการเข้าอบรม 7-Eleven Demonstation Store.xlsx';

console.log('📋 วิเคราะห์ระบบจาก Excel: ระบบการเข้าอบรม 7-Eleven Demonstration Store\n');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  console.log(`📊 พบ ${data.length} ฟีเจอร์\n`);
  
  const features = [];
  
  data.forEach((row, index) => {
    // Skip header row
    if (index === 0) return;
    
    const feature = {
      no: row['ระบบการเข้าอบรม 7-Eleven Demonstation Store'] || index,
      name: row['__EMPTY'] || '',
      description: row['__EMPTY_1'] || '',
      input: row['__EMPTY_2'] || '',
      output: row['__EMPTY_3'] || '',
      notes: row['__EMPTY_4'] || ''
    };
    
    if (feature.name) {
      features.push(feature);
    }
  });
  
  console.log('='.repeat(80));
  console.log('📋 รายการฟีเจอร์ทั้งหมด:');
  console.log('='.repeat(80));
  
  features.forEach((feature, i) => {
    console.log(`\n${i + 1}. ${feature.name}`);
    console.log(`   📝 รายละเอียด: ${feature.description}`);
    console.log(`   📥 Input: ${feature.input}`);
    console.log(`   📤 Output: ${feature.output}`);
    if (feature.notes) {
      console.log(`   💡 หมายเหตุ: ${feature.notes}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`✅ รวม ${features.length} ฟีเจอร์`);
  console.log('='.repeat(80));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

