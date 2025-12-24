'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  points: number;
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;
  const { user, isAuthenticated } = useAuthStore();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasAttempt, setHasAttempt] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchQuiz();
  }, [quizId, user, isAuthenticated, router]);

  useEffect(() => {
    if (started && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);

  const fetchQuiz = async () => {
    try {
      // Fetch quiz with course_id
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*, course_id')
        .eq('quiz_id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Check if already attempted (for pre-test, no retake)
      if (quizData.type === 'pre-test') {
        const { data: attempt, error: attemptError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', user?.student_id)
          .eq('quiz_id', quizId)
          .maybeSingle();

        if (attempt && !attemptError) {
          setHasAttempt(true);
          setResult(attempt);
          setSubmitted(true);
        }
      }

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (questionsError) throw questionsError;

      const formattedQuestions = (questionsData || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (quiz?.time_limit) {
      setTimeLeft(quiz.time_limit * 60); // Convert minutes to seconds
    }
    setStarted(true);
  };

  const handleSubmit = async () => {
    if (!started || submitted) return;

    setSubmitted(true);

    // Calculate score
    let correct = 0;
    let total = questions.length;

    questions.forEach((question) => {
      if (answers[question.question_id] === question.correct_answer) {
        correct++;
      }
    });

    const score = Math.round((correct / total) * 100);
    const passed = score >= (quiz?.passing_score || 70);
    const status = passed ? 'pass' : 'fail';

    // Save attempt
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          student_id: user?.student_id,
          quiz_id: quizId,
          score,
          status,
          answers: answers,
          completed_at: new Date().toISOString(),
          time_taken: quiz?.time_limit ? (quiz.time_limit * 60) - (timeLeft || 0) : null,
        })
        .select()
        .single();

      if (error) throw error;

      setResult({ 
        score, 
        status, 
        passed,
        course_id: quiz?.course_id || null 
      });

      // If post-test passed, mark enrollment as completed
      if (quiz?.type === 'post-test' && passed && quiz?.course_id) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', user?.student_id)
          .eq('course_id', quiz.course_id)
          .maybeSingle();

        if (enrollment && !enrollmentError) {
          await supabase
            .from('enrollments')
            .update({
              status: 'completed',
              progress_percent: 100,
              completed_at: new Date().toISOString(),
            })
            .eq('enrollment_id', enrollment.enrollment_id);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Alert>
          <AlertDescription>ไม่พบแบบทดสอบ</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (hasAttempt && quiz.type === 'pre-test') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>ผลการทดสอบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                {result.status === 'pass' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  คุณได้ทำแบบทดสอบนี้แล้ว (Pre-test ไม่สามารถทำซ้ำได้)
                  <br />
                  คะแนน: {result.score}% - {result.status === 'pass' ? 'ผ่าน' : 'ไม่ผ่าน'}
                </AlertDescription>
              </Alert>
              {quiz?.course_id ? (
                <Link href={`/learn/${quiz.course_id}`}>
                  <Button>กลับไปเรียน</Button>
                </Link>
              ) : (
                <Link href="/student/dashboard">
                  <Button>กลับไปหน้าแรก</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>ผลการทดสอบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold">
                  {result.score}%
                </div>
                <div className={`text-lg font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                </div>
                <div className="text-sm text-gray-600">
                  เกณฑ์ผ่าน: {quiz.passing_score}%
                </div>
              </div>

              <div className="space-y-2">
                {questions.map((question, index) => {
                  const isCorrect = answers[question.question_id] === question.correct_answer;
                  return (
                    <div
                      key={question.question_id}
                      className={`p-4 rounded-lg border ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">
                            {index + 1}. {question.question_text}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            คำตอบของคุณ: {answers[question.question_id] || 'ไม่ได้ตอบ'}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 mt-1">
                              คำตอบที่ถูกต้อง: {question.correct_answer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-4">
                <Link href="/student/dashboard">
                  <Button variant="outline">กลับไปหน้าแรก</Button>
                </Link>
                {quiz.type === 'post-test' && result.passed ? (
                  <Link href="/student/evaluation">
                    <Button>ทำแบบประเมิน</Button>
                  </Link>
                ) : result?.course_id ? (
                  <Link href={`/learn/${result.course_id}`}>
                    <Button>กลับไปเรียน</Button>
                  </Link>
                ) : (
                  <Link href="/student/dashboard">
                    <Button>กลับไปหน้าแรก</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{quiz.description || 'แบบทดสอบ'}</p>
              <div className="space-y-2">
                <p>จำนวนคำถาม: {questions.length} ข้อ</p>
                {quiz.time_limit && <p>เวลาที่กำหนด: {quiz.time_limit} นาที</p>}
                <p>เกณฑ์ผ่าน: {quiz.passing_score}%</p>
                {quiz.type === 'pre-test' && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ Pre-test สามารถทำได้เพียงครั้งเดียวเท่านั้น
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <Button onClick={handleStart} className="w-full" size="lg">
                เริ่มทำแบบทดสอบ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Timer */}
        {timeLeft !== null && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-lg">
                    เวลาที่เหลือ: {formatTime(timeLeft)}
                  </span>
                </div>
                <Button onClick={handleSubmit} variant="outline">
                  ส่งคำตอบ
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.question_id}>
              <CardHeader>
                <CardTitle>
                  คำถามที่ {index + 1} ({question.points} คะแนน)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 font-medium">{question.question_text}</p>
                <RadioGroup
                  value={answers[question.question_id] || ''}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [question.question_id]: value })
                  }
                >
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.question_id}-${optIndex}`} />
                      <Label
                        htmlFor={`${question.question_id}-${optIndex}`}
                        className="cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button onClick={handleSubmit} className="w-full" size="lg">
              ส่งคำตอบ
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
