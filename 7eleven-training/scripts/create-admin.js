const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('\n📝 กรุณาสร้างไฟล์ .env.local และใส่ Supabase credentials:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials ยังเป็น placeholder!');
  console.error('\n📝 กรุณาแก้ไขไฟล์ .env.local และใส่ Supabase credentials จริง\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('\n🔐 สร้าง Admin User\n');
  console.log('='.repeat(70));
  
  // Get admin details from command line or use defaults
  const args = process.argv.slice(2);
  const studentId = args[0] || 'ADMIN001';
  const password = args[1] || 'admin1234';
  const name = args[2] || 'ผู้ดูแลระบบ';
  const email = args[3] || 'admin@7eleven-training.com';
  
  console.log(`\n📋 ข้อมูล Admin ที่จะสร้าง:`);
  console.log(`   รหัสนักศึกษา: ${studentId}`);
  console.log(`   ชื่อ: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   รหัสผ่าน: ${password}`);
  console.log(`   Role: admin\n`);
  
  try {
    // Check if admin already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (checkError && !checkError.message.includes('does not exist')) {
      console.error('❌ Error checking existing user:', checkError.message);
      return;
    }
    
    if (existingUser) {
      console.log(`⚠️  รหัสนักศึกษา ${studentId} มีอยู่ในระบบแล้ว`);
      console.log('💡 ต้องการอัปเดตรหัสผ่านหรือไม่? (y/n): ');
      
      // For simplicity, we'll just update the password
      const passwordHash = await bcrypt.hash(password, 10);
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
        return;
      }
      
      console.log('✅ อัปเดต Admin สำเร็จ!\n');
      console.log('='.repeat(70));
      console.log('\n🔑 รหัสเข้าสู่ระบบ:');
      console.log(`   รหัสนักศึกษา: ${studentId}`);
      console.log(`   รหัสผ่าน: ${password}\n`);
      return;
    }
    
    // Create new admin
    const passwordHash = await bcrypt.hash(password, 10);
    
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
      return;
    }
    
    console.log('✅ สร้าง Admin สำเร็จ!\n');
    console.log('='.repeat(70));
    console.log('\n🔑 รหัสเข้าสู่ระบบ:');
    console.log(`   รหัสนักศึกษา: ${studentId}`);
    console.log(`   รหัสผ่าน: ${password}\n`);
    console.log('💡 คุณสามารถใช้รหัสนี้เข้าสู่ระบบได้ทันที\n');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

createAdmin();

