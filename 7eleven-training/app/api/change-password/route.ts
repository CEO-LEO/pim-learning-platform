import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, current_password, new_password } = body;

    // Validation
    if (!student_id || !current_password || !new_password) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (new_password.length < 4) {
      return NextResponse.json(
        { error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('student_id', student_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสผ่านในระบบ กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('student_id', student_id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ',
    });
  } catch (error) {
    console.error('Error in change-password API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}

