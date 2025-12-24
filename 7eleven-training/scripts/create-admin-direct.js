const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n🔐 สร้าง Admin User\n');
  console.log('='.repeat(70));
  
  // Get Supabase credentials
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  // If credentials are placeholders or missing, ask user
  if (!supabaseUrl || !supabaseKey || 
      supabaseUrl.includes('your-project-id') || 
      supabaseKey.includes('your-anon-key')) {
    
    console.log('📝 ต้องการ Supabase credentials เพื่อสร้าง admin user\n');
    
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      supabaseUrl = await question('กรุณาใส่ Supabase URL: ');
    }
    
    if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
      supabaseKey = await question('กรุณาใส่ Supabase Anon Key: ');
    }
    
    console.log();
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials!');
    rl.close();
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get admin details
  const studentId = process.argv[2] || 'ADMIN001';
  const password = process.argv[3] || 'admin1234';
  const name = process.argv[4] || 'ผู้ดูแลระบบ';
  const email = process.argv[5] || 'admin@7eleven-training.com';
  
  console.log(`\n📋 ข้อมูล Admin ที่จะสร้าง:`);
  console.log(`   รหัสนักศึกษา: ${studentId}`);
  console.log(`   ชื่อ: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   รหัสผ่าน: ${password}`);
  console.log(`   Role: admin\n`);
  
  try {
    // Test connection
    console.log('🔍 กำลังตรวจสอบการเชื่อมต่อ Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
        console.error('\n❌ ตาราง "users" ไม่มีใน Supabase database!');
        console.error('💡 กรุณารัน Prisma migrations ก่อน:');
        console.error('   npx prisma migrate dev\n');
        rl.close();
        process.exit(1);
      } else {
        console.error('\n❌ Error connecting to Supabase:', testError.message);
        rl.close();
        process.exit(1);
      }
    }
    
    console.log('✅ เชื่อมต่อ Supabase สำเร็จ!\n');
    
    // Check if admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('student_id, name, role')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (checkError && !checkError.message.includes('does not exist')) {
      console.error('❌ Error checking existing user:', checkError.message);
      rl.close();
      return;
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    if (existingUser) {
      console.log(`⚠️  รหัสนักศึกษา ${studentId} มีอยู่ในระบบแล้ว`);
      console.log(`   ชื่อปัจจุบัน: ${existingUser.name}`);
      console.log(`   Role ปัจจุบัน: ${existingUser.role || 'student'}`);
      console.log('\n💡 กำลังอัปเดตเป็น admin user...\n');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'admin',
          name: name,
          email: email
        })
        .eq('student_id', studentId);
      
      if (updateError) {
        console.error('❌ Error updating admin:', updateError.message);
        rl.close();
        return;
      }
      
      console.log('✅ อัปเดต Admin สำเร็จ!\n');
    } else {
      // Create new admin
      const { data, error } = await supabase
        .from('users')
        .insert({
          student_id: studentId,
          name: name,
          email: email,
          password_hash: passwordHash,
          role: 'admin',
          year_level: null,
          phone: null,
          birthdate: null,
          otp_code: null,
          otp_expires_at: null
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating admin:', error.message);
        rl.close();
        return;
      }
      
      console.log('✅ สร้าง Admin สำเร็จ!\n');
    }
    
    console.log('='.repeat(70));
    console.log('\n🔑 รหัสเข้าสู่ระบบ:');
    console.log(`   รหัสนักศึกษา: ${studentId}`);
    console.log(`   รหัสผ่าน: ${password}\n`);
    console.log('💡 คุณสามารถใช้รหัสนี้เข้าสู่ระบบได้ทันที\n');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  } finally {
    rl.close();
  }
}

createAdmin();

