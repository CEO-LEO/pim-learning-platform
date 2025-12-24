import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUrl, supabaseKey, databaseUrl } = body;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase URL และ Key จำเป็นต้องมี' },
        { status: 400 }
      );
    }

    // Validate URLs
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      return NextResponse.json(
        { error: 'Supabase URL ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!supabaseKey.startsWith('eyJ')) {
      return NextResponse.json(
        { error: 'Supabase Key ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Create .env.local content
    let envContent = `# Supabase Configuration
# สร้างโดยหน้า Setup Guide
# วันที่: ${new Date().toLocaleString('th-TH')}

NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim()}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey.trim()}
`;

    if (databaseUrl && databaseUrl.trim()) {
      envContent += `\n# Database Connection (สำหรับ Prisma)
DATABASE_URL=${databaseUrl.trim()}
`;
    }

    // Write to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    
    try {
      fs.writeFileSync(envPath, envContent, 'utf8');
      
      return NextResponse.json({
        success: true,
        message: 'บันทึกไฟล์ .env.local สำเร็จ!',
        path: envPath,
        nextSteps: [
          'รัน migrations: npx prisma migrate dev',
          'สร้าง Admin: npm run create-admin ADMIN001 admin1234',
          'รีเฟรชหน้า login เพื่อตรวจสอบการตั้งค่า'
        ]
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: `ไม่สามารถเขียนไฟล์ได้: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `เกิดข้อผิดพลาด: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({
        configured: false,
        message: 'ไฟล์ .env.local ยังไม่มี'
      });
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let supabaseUrl = '';
    let supabaseKey = '';
    let databaseUrl = '';
    
    lines.forEach(line => {
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        supabaseUrl = line.split('=')[1]?.trim() || '';
      }
      if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
        supabaseKey = line.split('=')[1]?.trim() || '';
      }
      if (line.startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('=')[1]?.trim() || '';
      }
    });

    const isConfigured = supabaseUrl && 
                        supabaseKey && 
                        !supabaseUrl.includes('your-project-id') && 
                        !supabaseUrl.includes('placeholder') &&
                        !supabaseKey.includes('your-anon-key') &&
                        !supabaseKey.includes('placeholder');

    return NextResponse.json({
      configured: isConfigured,
      hasUrl: !!supabaseUrl && !supabaseUrl.includes('your-project-id'),
      hasKey: !!supabaseKey && !supabaseKey.includes('your-anon-key'),
      hasDatabaseUrl: !!databaseUrl && databaseUrl.startsWith('postgresql://')
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `เกิดข้อผิดพลาด: ${error.message}` },
      { status: 500 }
    );
  }
}
