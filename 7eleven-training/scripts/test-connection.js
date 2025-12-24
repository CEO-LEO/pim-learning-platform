const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('\n🔌 ทดสอบการเชื่อมต่อ Supabase\n');
console.log('='.repeat(70));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('\n📝 กรุณาตั้งค่าใน .env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here\n');
  process.exit(1);
}

if (supabaseUrl.includes('your-project-id') || supabaseKey.includes('your-anon-key')) {
  console.error('❌ Supabase credentials ยังเป็น placeholder!');
  console.error('\n📝 กรุณาแก้ไขไฟล์ .env.local และใส่ Supabase credentials จริง\n');
  process.exit(1);
}

console.log(`🔗 Supabase URL: ${supabaseUrl.substring(0, 50)}...`);
console.log(`🔑 Using Key: ${supabaseKey.substring(0, 30)}...\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  try {
    console.log('⏳ กำลังทดสอบการเชื่อมต่อ...\n');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  ตาราง "users" ยังไม่มีใน Supabase');
        console.log('💡 ต้องรัน Prisma migrations ก่อน:');
        console.log('   npx prisma migrate dev\n');
        console.log('✅ แต่การเชื่อมต่อ Supabase สำเร็จ!\n');
      } else {
        console.error('❌ Error:', error.message);
        console.error('💡 ตรวจสอบ:');
        console.error('   - Supabase URL ถูกต้องหรือไม่');
        console.error('   - Supabase Key ถูกต้องหรือไม่');
        console.error('   - Internet connection\n');
        process.exit(1);
      }
    } else {
      console.log('✅ การเชื่อมต่อ Supabase สำเร็จ!\n');
      
      // Test 2: Count users
      try {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        console.log(`📊 จำนวน users ใน Supabase: ${count} คน\n`);
      } catch (err) {
        console.log('⚠️  ไม่สามารถนับจำนวน users ได้:', err.message);
      }
    }
    
    console.log('='.repeat(70));
    console.log('\n🎉 ทดสอบเสร็จสมบูรณ์!\n');
    
  } catch (err) {
    if (err.message.includes('ENOTFOUND') || err.message.includes('fetch failed')) {
      console.error('❌ ไม่สามารถเชื่อมต่อกับ Supabase ได้!');
      console.error('\n💡 ตรวจสอบ:');
      console.error('   - Internet connection');
      console.error('   - Supabase URL: ' + supabaseUrl);
      console.error('   - Supabase project ยัง active อยู่หรือไม่');
      console.error('   - Firewall หรือ proxy settings\n');
    } else {
      console.error('❌ Unexpected error:', err.message);
    }
    process.exit(1);
  }
})();

