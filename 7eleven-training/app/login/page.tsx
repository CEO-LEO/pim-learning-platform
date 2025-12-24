'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, user } = useAuthStore();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSupabaseWarning, setShowSupabaseWarning] = useState(false);

  useEffect(() => {
    setShowSupabaseWarning(!isSupabaseConfigured());
    
    // Redirect if already authenticated
    // Only redirect if we have a user with a role
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[LOGIN] Form submitted', { studentId: studentId.substring(0, 3) + '***', hasPassword: !!password });
    
    setLoading(true);
    setError('');

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Login attempt started',data:{studentId:studentId.substring(0,3)+'***',hasPassword:!!password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!isSupabaseConfigured()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Supabase not configured',data:{isConfigured:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setError('⚠️ Supabase credentials ยังไม่ได้ตั้งค่า กรุณาตั้งค่าก่อนเข้าสู่ระบบ');
      setLoading(false);
      return;
    }

    // Input validation
    const trimmedStudentId = studentId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedStudentId) {
      setError('กรุณากรอกรหัสนักศึกษา');
      setLoading(false);
      return;
    }

    if (!trimmedPassword) {
      setError('กรุณากรอกรหัสผ่าน');
      setLoading(false);
      return;
    }

    if (trimmedStudentId.length < 3) {
      setError('รหัสนักศึกษาต้องมีอย่างน้อย 3 ตัวอักษร');
      setLoading(false);
      return;
    }

    if (trimmedPassword.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Calling login API',data:{studentId:trimmedStudentId.substring(0,3)+'***',passwordLength:trimmedPassword.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: trimmedStudentId,
          password: trimmedPassword,
        }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Login API response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      const data = await response.json();
      console.log('[LOGIN] API Response:', { status: response.status, ok: response.ok, data });

      if (!response.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Login API error',data:{status:response.status,error:data.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.error('[LOGIN] Login failed:', data.error, 'Status:', response.status);
        
        // Provide helpful error messages
        let errorMessage = data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        if (response.status === 401) {
          if (trimmedStudentId.toUpperCase() === 'ADMIN001') {
            errorMessage = 'ไม่พบผู้ใช้ ADMIN001 ในระบบ กรุณารันคำสั่ง: npm run create-admin ADMIN001 admin1234';
          } else {
            errorMessage = 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง';
          }
        } else if (response.status === 500) {
          errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล';
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!data.success || !data.user) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Invalid response data',data:{hasSuccess:!!data.success,hasUser:!!data.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        console.error('[LOGIN] Invalid response:', data);
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ไม่ได้รับข้อมูลผู้ใช้');
        setLoading(false);
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/login/page.tsx:handleLogin',message:'Login successful',data:{role:data.user.role,studentId:data.user.student_id.substring(0,3)+'***'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      // Set user in auth store
      const userData = {
        student_id: data.user.student_id,
        name: data.user.name,
        email: data.user.email || undefined,
        role: data.user.role as 'student' | 'admin' | 'instructor',
      };
      
      console.log('[LOGIN] Setting user data:', userData);
      
      // Manually write to localStorage FIRST to ensure it's saved immediately
      // This is the format that zustand persist uses
      const authData = {
        state: {
          user: userData,
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(authData));
      console.log('[LOGIN] Auth data saved to localStorage:', authData);

      // Then set in zustand store (this will also write to localStorage but we already did it)
      setUser(userData);

      // Wait for both to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify localStorage was saved
      const savedAuth = localStorage.getItem('auth-storage');
      console.log('[LOGIN] Verified localStorage:', savedAuth);
      
      // Double check the data
      if (savedAuth) {
        try {
          const parsed = JSON.parse(savedAuth);
          console.log('[LOGIN] Parsed localStorage:', parsed);
          if (parsed?.state?.user?.role !== data.user.role) {
            console.error('[LOGIN] Role mismatch! Expected:', data.user.role, 'Got:', parsed?.state?.user?.role);
          }
        } catch (e) {
          console.error('[LOGIN] Error parsing saved auth:', e);
        }
      }

      // Use window.location.href for hard redirect to ensure auth state is loaded
      // This forces a full page reload which ensures localStorage is read properly
      if (data.user.role === 'admin') {
        console.log('[LOGIN] Redirecting to admin dashboard');
        window.location.href = '/admin/dashboard';
      } else if (data.user.role === 'instructor') {
        console.log('[LOGIN] Redirecting to instructor dashboard');
        window.location.href = '/instructor/dashboard';
      } else {
        console.log('[LOGIN] Redirecting to student dashboard');
        window.location.href = '/student/dashboard';
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        setError('⚠️ ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      } else if (err.message?.includes('Supabase')) {
        setError('⚠️ Supabase credentials ไม่ถูกต้อง กรุณาตรวจสอบการตั้งค่า');
      } else {
        setError(`เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">7</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">7-Eleven Training System</h1>
          <p className="text-gray-600">เข้าสู่ระบบเพื่อเริ่มต้นการเรียนรู้</p>
        </div>

        {/* Supabase Warning */}
        {showSupabaseWarning && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-3">⚠️ Supabase ยังไม่ได้ตั้งค่า</div>
              <div className="text-sm space-y-2">
                <p>กรุณาตั้งค่า Supabase credentials ก่อนใช้งานระบบ</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <Link href="/setup">
                    <Button className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white">
                      ⚙️ ไปที่หน้า Setup Guide
                    </Button>
                  </Link>
                  <div className="text-xs text-gray-600 self-center sm:self-auto sm:ml-2">
                    หรือรัน: <code className="bg-yellow-100 px-1 rounded">npm run quick-setup</code>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center">
              กรุณากรอกรหัสนักศึกษาและรหัสผ่าน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Student ID Input */}
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-semibold text-gray-700">รหัสนักศึกษา</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="กรอกรหัสนักศึกษา"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={loading}
                  className="h-11 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
                  autoFocus
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 pr-10 text-base border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    disabled={loading}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                disabled={loading}
                onClick={(e) => {
                  console.log('[LOGIN] Button clicked');
                  // Form will handle submit via onSubmit
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    เข้าสู่ระบบ
                  </>
                )}
              </Button>
            </form>

            {/* Setup Link */}
            <div className="mt-6 text-center">
              <Link
                href="/setup"
                className="text-sm text-gray-600 hover:text-green-600 hover:underline"
              >
                ต้องการความช่วยเหลือในการตั้งค่า?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 7-Eleven Training System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

