const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error(error.message);
}

