const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// Get credentials from command line or env
const args = process.argv.slice(2);
let supabaseUrl = args[0] || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = args[1] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const studentId = args[2] || 'ADMIN001';
const password = args[3] || 'admin1234';
const name = args[4] || 'ผู้ดูแลระบบ';
const email = args[5] || 'admin@7eleven-training.com';

if (!supabaseUrl || !supabaseKey || 
    supabaseUrl.includes('your-project-id') || 
    supabaseKey.includes('your-anon-key')) {
  console.error('\n❌ Missing Supabase credentials!\n');
  console.error('📝 วิธีใช้:');
  console.error('   node scripts/create-admin-simple.js [SUPABASE_URL] [SUPABASE_KEY] [STUDENT_ID] [PASSWORD]');
  console.error('\nหรือตั้งค่าใน .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('\n🔐 สร้าง Admin User\n');
  console.log('='.repeat(70));
  console.log(`\n📋 ข้อมูล Admin:`);
  console.log(`   รหัสนักศึกษา: ${studentId}`);
  console.log(`   ชื่อ: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   รหัสผ่าน: ${password}\n`);
  
  try {
    // Test connection
    console.log('🔍 กำลังตรวจสอบการเชื่อมต่อ...');
    const { error: testError } = await supabase.from('users').select('count').limit(1);
    
    if (testError) {
      if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
        console.error('\n❌ ตาราง "users" ไม่มีใน Supabase!');
        console.error('💡 รัน: npx prisma migrate dev\n');
        process.exit(1);
      }
      throw testError;
    }
    
    console.log('✅ เชื่อมต่อสำเร็จ!\n');
    
    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('student_id, role')
      .eq('student_id', studentId)
      .maybeSingle();
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    if (existing) {
      console.log('⚠️  User มีอยู่แล้ว กำลังอัปเดต...\n');
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'admin',
          name: name,
          email: email
        })
        .eq('student_id', studentId);
      
      if (error) throw error;
      console.log('✅ อัปเดตสำเร็จ!\n');
    } else {
      const { error } = await supabase
        .from('users')
        .insert({
          student_id: studentId,
          name: name,
          email: email,
          password_hash: passwordHash,
          role: 'admin'
        });
      
      if (error) throw error;
      console.log('✅ สร้างสำเร็จ!\n');
    }
    
    console.log('='.repeat(70));
    console.log('\n🔑 รหัสเข้าสู่ระบบ:');
    console.log(`   รหัสนักศึกษา: ${studentId}`);
    console.log(`   รหัสผ่าน: ${password}\n`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();

