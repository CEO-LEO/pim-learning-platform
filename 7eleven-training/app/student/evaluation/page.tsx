'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Star } from 'lucide-react';

export default function EvaluationPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check if already submitted
    checkSubmission();
  }, [user, isAuthenticated, router]);

  const checkSubmission = async () => {
    try {
      const { data, error: evalError } = await supabase
        .from('evaluations')
        .select('*')
        .eq('student_id', user?.student_id)
        .maybeSingle();

      if (data && !evalError) {
        setSubmitted(true);
        setRating(data.rating.toString());
        setComment(data.comment || '');
      }
    } catch (error) {
      // Not submitted yet
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('evaluations').insert({
        student_id: user.student_id,
        rating: parseInt(rating),
        comment: comment || null,
      });

      if (error) throw error;

      setSubmitted(true);
      alert('ส่งแบบประเมินสำเร็จ!');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('เกิดข้อผิดพลาดในการส่งแบบประเมิน');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>แบบประเมินความพึงพอใจ</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  คุณได้ส่งแบบประเมินแล้ว ขอบคุณสำหรับความคิดเห็น
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label>คุณให้คะแนนความพึงพอใจเท่าไร? *</Label>
                  <RadioGroup value={rating} onValueChange={setRating}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="rating-5" />
                      <Label htmlFor="rating-5" className="cursor-pointer flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="ml-2">5 - ดีมาก</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="rating-4" />
                      <Label htmlFor="rating-4" className="cursor-pointer flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="ml-2">4 - ดี</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="rating-3" />
                      <Label htmlFor="rating-3" className="cursor-pointer flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="ml-2">3 - ปานกลาง</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="rating-2" />
                      <Label htmlFor="rating-2" className="cursor-pointer flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="ml-2">2 - พอใช้</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="rating-1" />
                      <Label htmlFor="rating-1" className="cursor-pointer flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="ml-2">1 - ควรปรับปรุง</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">ความคิดเห็นเพิ่มเติม (ไม่บังคับ)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={5}
                    placeholder="กรุณาแสดงความคิดเห็น..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting || !rating}>
                  {submitting ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
