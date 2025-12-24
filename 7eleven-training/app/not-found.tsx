import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <CardTitle className="text-2xl">ไม่พบหน้าที่คุณกำลังมองหา</CardTitle>
          <CardDescription>
            หน้าที่คุณกำลังพยายามเข้าถึงไม่มีอยู่ในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Link href="/login">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                กลับไปหน้าแรก
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ไปที่หน้า Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
