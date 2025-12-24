import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Login API called',data:{isConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
  // #endregion

  try {
    if (!isSupabaseConfigured()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Supabase not configured',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Supabase credentials are not configured' },
        { status: 500 }
      );
    }

    const { student_id, password } = await request.json();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Request parsed',data:{hasStudentId:!!student_id,hasPassword:!!password,studentIdLength:student_id?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion

    // Input validation
    if (!student_id || !password) {
      return NextResponse.json(
        { error: 'Student ID and password are required' },
        { status: 400 }
      );
    }

    const trimmedStudentId = student_id.trim();
    const trimmedPassword = password.trim();

    if (trimmedStudentId.length < 3) {
      return NextResponse.json(
        { error: 'Student ID must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    // Query user from Supabase
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Querying Supabase',data:{studentId:trimmedStudentId.substring(0,3)+'***'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    const { data: userData, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', trimmedStudentId)
      .maybeSingle();

    if (queryError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Supabase query error',data:{error:queryError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      console.error('Supabase query error:', queryError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!userData) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'User not found',data:{studentId:trimmedStudentId.substring(0,3)+'***'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      console.error('[LOGIN API] User not found:', trimmedStudentId);
      
      // Provide helpful error message for ADMIN001
      let errorMessage = 'Invalid student ID or password';
      if (trimmedStudentId.toUpperCase() === 'ADMIN001') {
        errorMessage = 'ไม่พบผู้ใช้ ADMIN001 ในระบบ กรุณารันคำสั่ง: npm run create-admin ADMIN001 admin1234';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Verifying password',data:{hasPasswordHash:!!userData.password_hash},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
    // #endregion

    // Check if password_hash exists
    if (!userData.password_hash) {
      console.error('[LOGIN API] User has no password hash:', trimmedStudentId);
      return NextResponse.json(
        { error: 'User account is not properly configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    const passwordMatch = await bcrypt.compare(trimmedPassword, userData.password_hash);
    console.log('[LOGIN API] Password match result:', passwordMatch, 'for user:', trimmedStudentId);

    if (!passwordMatch) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Password mismatch',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      console.error('[LOGIN API] Password mismatch for user:', trimmedStudentId);
      return NextResponse.json(
        { error: 'Invalid student ID or password' },
        { status: 401 }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/login/route.ts:POST',message:'Login successful',data:{role:userData.role,studentId:userData.student_id.substring(0,3)+'***'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'P'})}).catch(()=>{});
    // #endregion

    console.log('[LOGIN API] Login successful for user:', userData.student_id, 'role:', userData.role);

    // Return user data (without password_hash)
    const { password_hash, ...userWithoutPassword } = userData;

    const responseData = {
      success: true,
      user: {
        student_id: userWithoutPassword.student_id,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email || undefined,
        role: userWithoutPassword.role,
      },
    };

    console.log('[LOGIN API] Returning response:', { ...responseData, user: { ...responseData.user } });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

