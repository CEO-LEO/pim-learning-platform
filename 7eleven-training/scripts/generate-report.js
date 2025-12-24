const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('\n📊 สร้างรายงานสรุประบบ\n');
console.log('='.repeat(70));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const sqliteDbPath = path.join(__dirname, '../../server/database/pim_learning.db');

let report = {
  timestamp: new Date().toLocaleString('th-TH'),
  sqlite: {},
  supabase: {},
  status: 'unknown'
};

// Check SQLite
if (fs.existsSync(sqliteDbPath)) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(sqliteDbPath, (err) => {
      if (err) {
        report.sqlite = { error: err.message };
        generateReport();
        return;
      }
      
      db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['student'], (err, row) => {
        if (err) {
          report.sqlite = { error: err.message };
        } else {
          report.sqlite = {
            found: true,
            studentCount: row.count
          };
        }
        db.close();
        checkSupabase();
      });
    });
  });
} else {
  report.sqlite = { found: false, error: 'Database file not found' };
  checkSupabase();
}

async function checkSupabase() {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    report.supabase = { configured: false };
    generateReport();
    return;
  }
  
  report.supabase = { configured: true };
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');
    
    if (error) {
      report.supabase.error = error.message;
      report.supabase.connected = false;
    } else {
      report.supabase.connected = true;
      report.supabase.studentCount = count;
    }
  } catch (err) {
    report.supabase.connected = false;
    report.supabase.error = err.message;
  }
  
  generateReport();
}

function generateReport() {
  console.log('\n📋 รายงานสรุป:\n');
  
  // SQLite Status
  console.log('📁 SQLite Database:');
  if (report.sqlite.found) {
    console.log(`   ✅ พบ database`);
    console.log(`   📊 จำนวนนักเรียน: ${report.sqlite.studentCount} คน`);
  } else {
    console.log(`   ❌ ${report.sqlite.error || 'ไม่พบ database'}`);
  }
  console.log();
  
  // Supabase Status
  console.log('☁️  Supabase:');
  if (!report.supabase.configured) {
    console.log('   ❌ ยังไม่ได้ตั้งค่า credentials');
  } else if (report.supabase.connected) {
    console.log('   ✅ เชื่อมต่อสำเร็จ');
    console.log(`   📊 จำนวนนักเรียน: ${report.supabase.studentCount} คน`);
  } else {
    console.log('   ❌ ไม่สามารถเชื่อมต่อได้');
    console.log(`   ⚠️  Error: ${report.supabase.error || 'Unknown error'}`);
  }
  console.log();
  
  // Comparison
  if (report.sqlite.studentCount && report.supabase.studentCount !== undefined) {
    const diff = report.sqlite.studentCount - report.supabase.studentCount;
    console.log('📊 เปรียบเทียบ:');
    console.log(`   SQLite: ${report.sqlite.studentCount} คน`);
    console.log(`   Supabase: ${report.supabase.studentCount} คน`);
    if (diff > 0) {
      console.log(`   ⚠️  ยังไม่ได้ import: ${diff} คน`);
    } else if (diff < 0) {
      console.log(`   ℹ️  Supabase มีมากกว่า: ${Math.abs(diff)} คน`);
    } else {
      console.log(`   ✅ จำนวนเท่ากัน`);
    }
    console.log();
  }
  
  // Recommendations
  console.log('💡 คำแนะนำ:\n');
  
  if (!report.sqlite.found) {
    console.log('   1. ตรวจสอบ SQLite database path');
  }
  
  if (!report.supabase.configured) {
    console.log('   1. ตั้งค่า Supabase credentials: npm run init-env');
  } else if (!report.supabase.connected) {
    console.log('   1. ตรวจสอบ Supabase connection: npm run test-connection');
  } else if (report.sqlite.studentCount && report.supabase.studentCount < report.sqlite.studentCount) {
    console.log('   1. Import ข้อมูลนักเรียน: npm run import-students');
  } else {
    console.log('   ✅ ระบบพร้อมใช้งาน!');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📅 สร้างรายงานเมื่อ: ${report.timestamp}\n`);
  
  // Save to file
  const reportPath = path.join(__dirname, '../system-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`💾 บันทึกรายงานไว้ที่: ${reportPath}\n`);
}

