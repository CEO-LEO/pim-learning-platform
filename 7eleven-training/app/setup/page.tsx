'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setIsConfigured(!!isSupabaseConfigured());
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/setup');
      const data = await response.json();
      setIsConfigured(data.configured || false);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const saveConfiguration = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSaveMessage('กรุณากรอก Supabase URL และ Key');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey,
          databaseUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('✅ บันทึกสำเร็จ! กรุณารีเฟรชหน้าเว็บ');
        setIsConfigured(true);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setSaveMessage(`❌ ${data.error || 'เกิดข้อผิดพลาด'}`);
      }
    } catch (error: any) {
      setSaveMessage(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const generateEnvContent = () => {
    return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
DATABASE_URL=${databaseUrl}
`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">7</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Guide</h1>
          <p className="text-gray-600">ตั้งค่า Supabase สำหรับ 7-Eleven Training System</p>
        </div>

        {/* Status Check */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>สถานะการตั้งค่า</CardTitle>
            <CardDescription>ตรวจสอบสถานะ Supabase configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Supabase Configuration</span>
                {isConfigured ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>ตั้งค่าแล้ว</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>ยังไม่ได้ตั้งค่า</span>
                  </div>
                )}
              </div>
              {!isConfigured && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    กรุณาตั้งค่า Supabase credentials ในไฟล์ .env.local
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Create Supabase Project */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ขั้นตอนที่ 1: สร้าง Supabase Project</CardTitle>
            <CardDescription>สร้าง Supabase project ใหม่ (ถ้ายังไม่มี)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>ไปที่ <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">https://supabase.com <ExternalLink className="h-3 w-3 ml-1" /></a></li>
              <li>สร้าง Account (ถ้ายังไม่มี)</li>
              <li>คลิก "New Project"</li>
              <li>กรอกข้อมูล:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Name: ตั้งชื่อโปรเจกต์</li>
                  <li>Database Password: ตั้งรหัสผ่านที่แข็งแรง (จำไว้!)</li>
                  <li>Region: เลือก region ที่ใกล้ที่สุด</li>
                </ul>
              </li>
              <li>คลิก "Create new project" และรอให้สร้างเสร็จ (ประมาณ 2-3 นาที)</li>
            </ol>
            <div className="pt-4">
              <Button onClick={() => window.open('https://supabase.com', '_blank')} variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                ไปที่ Supabase
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Get Credentials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ขั้นตอนที่ 2: หา Supabase Credentials</CardTitle>
            <CardDescription>คัดลอก URL และ Key จาก Supabase Dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">1. Project URL</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://xxxxx.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                  />
                  {supabaseUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(supabaseUrl, 'url')}
                    >
                      <Copy className={`h-4 w-4 ${copied === 'url' ? 'text-green-600' : ''}`} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  หาได้ที่: Settings → API → Project URL
                </p>
              </div>

              <div>
                <Label className="mb-2 block">2. Anon Key</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    type="password"
                  />
                  {supabaseKey && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(supabaseKey, 'key')}
                    >
                      <Copy className={`h-4 w-4 ${copied === 'key' ? 'text-green-600' : ''}`} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  หาได้ที่: Settings → API → Project API keys → anon public
                </p>
              </div>

              <div>
                <Label className="mb-2 block">3. Database URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
                    value={databaseUrl}
                    onChange={(e) => setDatabaseUrl(e.target.value)}
                    type="password"
                  />
                  {databaseUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(databaseUrl, 'db')}
                    >
                      <Copy className={`h-4 w-4 ${copied === 'db' ? 'text-green-600' : ''}`} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  หาได้ที่: Settings → Database → Connection string → URI
                  <br />
                  แทนที่ [PASSWORD] ด้วยรหัสผ่านที่ตั้งไว้ตอนสร้าง project
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Setup */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ขั้นตอนที่ 3: ตั้งค่าในโปรเจกต์</CardTitle>
            <CardDescription>บันทึกข้อมูลลงไฟล์ .env.local</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supabaseUrl && supabaseKey ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    คัดลอกเนื้อหาด้านล่างไปใส่ในไฟล์ <code className="bg-gray-100 px-1 rounded">.env.local</code>
                  </AlertDescription>
                </Alert>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
                    {generateEnvContent()}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateEnvContent(), 'env')}
                  >
                    <Copy className={`h-4 w-4 mr-1 ${copied === 'env' ? 'text-green-600' : ''}`} />
                    {copied === 'env' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="space-y-4">
                  {saveMessage && (
                    <Alert className={saveMessage.includes('✅') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                      <AlertCircle className={`h-4 w-4 ${saveMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`} />
                      <AlertDescription className={saveMessage.includes('✅') ? 'text-green-800' : 'text-red-800'}>
                        {saveMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    onClick={saveConfiguration}
                    disabled={saving || !supabaseUrl || !supabaseKey}
                    className="w-full"
                  >
                    {saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
                  </Button>

                  <div className="text-sm text-gray-600 space-y-2 pt-2 border-t">
                    <p><strong>หรือวิธีอื่น:</strong></p>
                    <p><strong>วิธีที่ 1:</strong> คัดลอกเนื้อหาด้านบนไปใส่ในไฟล์ <code className="bg-gray-100 px-1 rounded">.env.local</code></p>
                    <p><strong>วิธีที่ 2:</strong> รันคำสั่งใน terminal:</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs">
                      npm run quick-setup
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  กรุณากรอก Supabase URL และ Key ก่อน
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>ขั้นตอนที่ 4: ขั้นตอนถัดไป</CardTitle>
            <CardDescription>หลังจากตั้งค่า Supabase แล้ว</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <strong>ตรวจสอบการตั้งค่า:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npm run check-status</pre>
              </li>
              <li>
                <strong>รัน Prisma Migrations:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npx prisma migrate dev</pre>
              </li>
              <li>
                <strong>สร้าง Admin User:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">npm run create-admin ADMIN001 admin1234</pre>
              </li>
              <li>
                <strong>Login:</strong> ไปที่{' '}
                <a href="/login" className="text-blue-600 hover:underline">/login</a> และใช้รหัส{' '}
                <code className="bg-gray-100 px-1 rounded">ADMIN001</code> / <code className="bg-gray-100 px-1 rounded">admin1234</code>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

