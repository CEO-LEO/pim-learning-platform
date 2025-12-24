const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupComplete() {
  console.log('\n🚀 ระบบ Setup ครบถ้วนสำหรับ 7-Eleven Training System\n');
  console.log('='.repeat(70));
  
  // Step 1: Check/Setup Environment Variables
  console.log('\n📋 Step 1: ตรวจสอบ Environment Variables\n');
  
  const envPath = path.join(__dirname, '../.env.local');
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  let databaseUrl = process.env.DATABASE_URL;
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseKey;
    databaseUrl = process.env.DATABASE_URL || databaseUrl;
  }
  
  const needsConfig = !supabaseUrl || !supabaseKey || 
                      supabaseUrl.includes('your-project-id') || 
                      supabaseKey.includes('your-anon-key');
  
  if (needsConfig) {
    console.log('⚠️  ยังไม่ได้ตั้งค่า Supabase credentials\n');
    console.log('📝 กรุณากรอกข้อมูล Supabase:\n');
    
    supabaseUrl = await question('1. Supabase Project URL (https://xxxxx.supabase.co): ');
    supabaseKey = await question('2. Supabase Anon Key (eyJ...): ');
    databaseUrl = await question('3. Database URL (postgresql://...) [optional]: ');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('\n❌ Supabase credentials จำเป็นต้องมี!');
      rl.close();
      process.exit(1);
    }
    
    // Save to .env.local
    let envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey.trim()}
`;
    
    if (databaseUrl && databaseUrl.trim()) {
      envContent += `\n# Database Connection
DATABASE_URL=${databaseUrl.trim()}
`;
    }
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ บันทึก .env.local สำเร็จ!\n');
    
    // Reload env
    require('dotenv').config({ path: envPath });
  } else {
    console.log('✅ Supabase credentials พร้อมใช้งาน\n');
  }
  
  // Step 2: Verify Supabase Connection
  console.log('📋 Step 2: ตรวจสอบการเชื่อมต่อ Supabase\n');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  ตาราง users ยังไม่มี ต้องรัน migrations\n');
        
        // Step 3: Run Prisma Migrations
        console.log('📋 Step 3: รัน Prisma Migrations\n');
        
        if (!databaseUrl) {
          console.error('❌ DATABASE_URL ไม่ได้ตั้งค่า จำเป็นสำหรับ migrations!');
          console.error('💡 กรุณาตั้งค่า DATABASE_URL ใน .env.local\n');
          rl.close();
          process.exit(1);
        }
        
        try {
          console.log('⏳ กำลังรัน Prisma migrations...\n');
          execSync('npx prisma migrate dev --name init', {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, DATABASE_URL: databaseUrl }
          });
          console.log('\n✅ Migrations สำเร็จ!\n');
        } catch (err) {
          console.error('\n❌ Error running migrations:', err.message);
          console.error('💡 กรุณารันด้วยตนเอง: npx prisma migrate dev\n');
          rl.close();
          process.exit(1);
        }
      } else {
        console.error('❌ Error connecting to Supabase:', error.message);
        rl.close();
        process.exit(1);
      }
    } else {
      console.log('✅ เชื่อมต่อ Supabase สำเร็จ!\n');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    rl.close();
    process.exit(1);
  }
  
  // Step 4: Create Admin User
  console.log('📋 Step 4: สร้าง Admin User\n');
  
  const adminId = 'ADMIN001';
  const adminPassword = 'admin1234';
  const adminName = 'ผู้ดูแลระบบ';
  const adminEmail = 'admin@7eleven-training.com';
  
  try {
    // Check if admin exists
    const { data: existing } = await supabase
      .from('users')
      .select('student_id, role')
      .eq('student_id', adminId)
      .maybeSingle();
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    if (existing) {
      console.log('⚠️  Admin user มีอยู่แล้ว กำลังอัปเดต...\n');
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: 'admin',
          name: adminName,
          email: adminEmail
        })
        .eq('student_id', adminId);
      
      if (error) throw error;
      console.log('✅ อัปเดต Admin สำเร็จ!\n');
    } else {
      const { error } = await supabase
        .from('users')
        .insert({
          student_id: adminId,
          name: adminName,
          email: adminEmail,
          password_hash: passwordHash,
          role: 'admin'
        });
      
      if (error) throw error;
      console.log('✅ สร้าง Admin สำเร็จ!\n');
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 Setup เสร็จสมบูรณ์!\n');
    console.log('🔑 รหัสเข้าสู่ระบบ Admin:');
    console.log(`   รหัสนักศึกษา: ${adminId}`);
    console.log(`   รหัสผ่าน: ${adminPassword}\n`);
    console.log('💡 คุณสามารถ login ได้ที่: http://localhost:3000/login\n');
    
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    rl.close();
  }
}

setupComplete();

