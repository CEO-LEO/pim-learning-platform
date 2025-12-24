# Flow การทำงานของระบบ PIM Learning Platform

## 1. Flow การทำงานของ Pre-test

### 1.1 การเข้าถึง Pre-test
```
User เข้าหน้า Module
  ↓
GET /api/quizzes/module/:moduleId/all
  ↓
Backend Query:
  SELECT q.*, 
    COALESCE((SELECT qr2.passed FROM quiz_results ...), -1) as last_passed
  FROM quizzes q WHERE q.module_id = ? AND q.order_index = 0
  ↓
Backend Normalize:
  - ถ้า last_passed = null/undefined → -1
  - ถ้า last_passed = string → parseInt()
  - ถ้า last_passed != 0 และ != 1 → -1
  ↓
Frontend รับข้อมูล:
  - last_passed = -1 (ยังไม่ทำ)
  - last_passed = 0 (ทำแล้วแต่ไม่ผ่าน)
  - last_passed = 1 (ทำแล้วและผ่าน)
  ↓
Frontend Logic:
  pretestDone = (normalizedLastPassed === 0 || normalizedLastPassed === 1)
  ↓
ถ้า pretestDone = false (last_passed = -1)
  → แสดงปุ่ม "เริ่มทำแบบทดสอบก่อนเรียน" (สีส้ม)
  → User สามารถกดปุ่มเพื่อทำ Pre-test ได้
  ↓
ถ้า pretestDone = true (last_passed = 0 หรือ 1)
  → แสดงสถานะ "ทำแบบทดสอบก่อนเรียนแล้ว" (สีเขียว)
  → ไม่สามารถทำซ้ำได้ (allow_retake = 0)
```

### 1.2 การทำ Pre-test
```
User กดปุ่ม "เริ่มทำแบบทดสอบก่อนเรียน"
  ↓
GET /api/quizzes/:quizId
  ↓
Backend ตรวจสอบ:
  - order_index = 0? (ใช่ Pre-test)
  - allow_retake = 0? (ไม่ให้ทำซ้ำ)
  - มี quiz_results สำหรับ user นี้หรือไม่?
  ↓
ถ้ามี quiz_results แล้ว
  → Return 403: "คุณได้ทำแบบทดสอบก่อนเรียน (Pre-test) ไปแล้ว ไม่สามารถทำซ้ำได้"
  → Redirect กลับไปหน้า Module
  ↓
ถ้ายังไม่มี quiz_results
  → Return quiz พร้อม questions (ไม่มี correct answers)
  → User ทำแบบทดสอบ
  ↓
POST /api/quizzes/:quizId/submit
  ↓
Backend บันทึกผลลัพธ์:
  - score, passed, completed_at
  ↓
ถ้า passed = 1
  → อนุญาตให้ดูวิดีโอได้
  → Redirect กลับไปหน้า Module
```

## 2. Flow การทำงานของ Video

### 2.1 การเข้าถึง Video
```
User กดวิดีโอจากหน้า Module
  ↓
GET /api/videos/:videoId
  ↓
Backend ตรวจสอบ:
  - Pre-test ทำเสร็จแล้วหรือไม่? (pretest_done > 0)
  ↓
ถ้า Pre-test ยังไม่ทำ
  → Return 403: "กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ"
  → Redirect กลับไปหน้า Module
  ↓
ถ้า Pre-test ทำเสร็จแล้ว
  → Return video data + progress
  → User สามารถดูวิดีโอได้
```

### 2.2 การดูวิดีโอ
```
User ดูวิดีโอ
  ↓
Video Player ติดตาม progress:
  - watch_time (เวลาที่ดูแล้ว)
  - is_complete (ดูครบ 100% หรือไม่)
  ↓
Update progress ทุก 5 วินาที:
  PUT /api/videos/:videoId/progress
  ↓
เมื่อดูครบ 100%
  → is_complete = 1
  → อนุญาตให้ทำ Post-test ได้
```

## 3. Flow การทำงานของ Post-test

### 3.1 การเข้าถึง Post-test
```
User เข้าหน้า Module
  ↓
ระบบตรวจสอบ Post-test Status
  ↓
สำหรับแต่ละ Post-test (order_index > 0):
  - ตรวจสอบวิดีโอที่เกี่ยวข้อง (order_index = video.order_index)
  - ตรวจสอบว่า video.is_complete = 1 หรือไม่
  ↓
ถ้าวิดีโอยังไม่ครบ 100%
  → แสดงปุ่ม disabled: "ทำแบบทดสอบ (ต้องดูวิดีโอที่ X ครบ 100%)"
  → User ไม่สามารถทำ Post-test ได้
  ↓
ถ้าวิดีโอครบ 100% แล้ว
  → แสดงปุ่ม "ทำแบบทดสอบ" (สีม่วง)
  → User สามารถกดปุ่มเพื่อทำ Post-test ได้
```

### 3.2 การทำ Post-test
```
User กดปุ่ม "ทำแบบทดสอบ"
  ↓
GET /api/quizzes/:quizId
  ↓
Backend ตรวจสอบ:
  - order_index > 0? (ใช่ Post-test)
  - วิดีโอที่เกี่ยวข้อง (order_index) ดูครบ 100% หรือไม่?
  ↓
ถ้าวิดีโอยังไม่ครบ 100%
  → Return 403: "กรุณาดูวิดีโอให้ครบ 100% ก่อนทำแบบทดสอบ"
  → Redirect กลับไปหน้า Module
  ↓
ถ้าวิดีโอครบ 100% แล้ว
  → Return quiz พร้อม questions (ไม่มี correct answers)
  → User ทำแบบทดสอบ
  ↓
POST /api/quizzes/:quizId/submit
  ↓
Backend บันทึกผลลัพธ์:
  - score, passed, completed_at
  - allow_retake = 1 (สามารถทำซ้ำได้)
  ↓
แสดงผลลัพธ์:
  - คะแนน
  - ผ่าน/ไม่ผ่าน
  → Redirect กลับไปหน้า Module
```

## 4. Flow การทำงานของ Database

### 4.1 Quiz Results Table
```
quiz_results:
  - result_id (PK)
  - user_id (FK)
  - quiz_id (FK)
  - score (0-100)
  - passed (0 = ไม่ผ่าน, 1 = ผ่าน)
  - completed_at (timestamp)
```

### 4.2 Video Progress Table
```
video_progress:
  - progress_id (PK)
  - user_id (FK)
  - video_id (FK)
  - watch_time (seconds)
  - is_complete (0 = ยังไม่ครบ, 1 = ครบ 100%)
  - last_watched (timestamp)
```

## 5. Flow การทำงานของ API Endpoints

### 5.1 GET /api/quizzes/module/:moduleId/all
```
Purpose: ดึงข้อมูล quizzes ทั้งหมดของ module
  ↓
Return:
  - quizzes[] (pre-test + post-tests)
  - last_score (-1 = ยังไม่ทำ, 0-100 = คะแนน)
  - last_passed (-1 = ยังไม่ทำ, 0 = ไม่ผ่าน, 1 = ผ่าน)
  - last_completed (timestamp หรือ '')
```

### 5.2 GET /api/quizzes/:quizId
```
Purpose: ดึงข้อมูล quiz พร้อม questions
  ↓
ตรวจสอบ:
  - Pre-test: ตรวจสอบ allow_retake และ quiz_results
  - Post-test: ตรวจสอบ video completion
  ↓
Return:
  - quiz data
  - questions[] (ไม่มี correct answers)
```

### 5.3 POST /api/quizzes/:quizId/submit
```
Purpose: ส่งคำตอบและบันทึกผลลัพธ์
  ↓
ตรวจสอบ:
  - Pre-test: ตรวจสอบ allow_retake
  - Post-test: ตรวจสอบ video completion
  ↓
คำนวณคะแนน:
  - score = (จำนวนคำตอบถูก / จำนวนคำถามทั้งหมด) * 100
  - passed = score >= passing_score ? 1 : 0
  ↓
บันทึกผลลัพธ์:
  - INSERT INTO quiz_results
  ↓
Return:
  - result data (score, passed, etc.)
```

### 5.4 GET /api/videos/:videoId
```
Purpose: ดึงข้อมูล video
  ↓
ตรวจสอบ:
  - Pre-test ทำเสร็จแล้วหรือไม่?
  ↓
Return:
  - video data
  - watch_time
  - is_complete
```

### 5.5 PUT /api/videos/:videoId/progress
```
Purpose: อัปเดต progress การดูวิดีโอ
  ↓
ตรวจสอบ:
  - Pre-test ทำเสร็จแล้วหรือไม่?
  ↓
บันทึก progress:
  - UPDATE video_progress
  - watch_time
  - is_complete (ถ้าครบ 100%)
```

## 6. Flow การทำงานของ Frontend

### 6.1 Modules.js (หน้า Module)
```
Component: QuizSection
  ↓
useEffect:
  - fetchQuizzes() ทุก 10 วินาที
  - Reset state เมื่อ moduleId เปลี่ยน
  ↓
Render:
  - Pre-test Section:
    * ถ้า pretestDone = false → แสดงปุ่ม "เริ่มทำแบบทดสอบก่อนเรียน"
    * ถ้า pretestDone = true → แสดงสถานะ "ทำเสร็จแล้ว"
  - Videos Section:
    * ถ้า pretestDone = false → opacity-50, pointer-events-none
    * ถ้า pretestDone = true → แสดงวิดีโอปกติ
  - Post-tests Section:
    * ตรวจสอบ video.is_complete สำหรับแต่ละ post-test
    * แสดงปุ่ม disabled หรือ enabled ตามสถานะ
```

### 6.2 Quiz.js (หน้า Quiz)
```
Component: Quiz
  ↓
useEffect:
  - fetchQuiz() เมื่อ component mount
  - fetchAttemptInfo() เพื่อตรวจสอบสถานะ
  ↓
Render:
  - แสดงคำถาม
  - แสดงตัวเลือก
  - แสดง timer (ถ้ามี)
  ↓
Submit:
  - POST /api/quizzes/:quizId/submit
  - แสดงผลลัพธ์
  - Redirect กลับไปหน้า Module
```

### 6.3 VideoPlayer.js (หน้า Video)
```
Component: VideoPlayer
  ↓
useEffect:
  - fetchVideo() เมื่อ component mount
  - updateProgress() ทุก 5 วินาที
  ↓
Render:
  - แสดง video player
  - แสดง progress bar
  - แสดง controls
  ↓
Error Handling:
  - ถ้า 403 (pre-test ไม่ทำ) → Redirect ไปหน้า Module
  - แสดง error message
```

## 7. สรุป Flow ทั้งหมด

```
1. User Login
   ↓
2. เข้าหน้า Module
   ↓
3. ทำ Pre-test (order_index = 0)
   - ต้องทำก่อนดูวิดีโอ
   - ทำได้เพียงครั้งเดียว (allow_retake = 0)
   ↓
4. ดูวิดีโอ (หลังจากทำ Pre-test เสร็จ)
   - ต้องดูครบ 100% ก่อนทำ Post-test
   ↓
5. ทำ Post-test (order_index > 0)
   - ต้องดูวิดีโอที่เกี่ยวข้องครบ 100% ก่อน
   - สามารถทำซ้ำได้ (allow_retake = 1)
   ↓
6. ทำ Post-test ถัดไป (ถ้ามี)
   - ต้องดูวิดีโอที่เกี่ยวข้องครบ 100% ก่อน
   ↓
7. ทำ Evaluation (ถ้าต้องการ)
```

## 8. เงื่อนไขสำคัญ

### 8.1 Pre-test
- **order_index = 0**
- **allow_retake = 0** (ทำได้เพียงครั้งเดียว)
- **ต้องทำก่อนดูวิดีโอ**
- **last_passed = -1** = ยังไม่ทำ
- **last_passed = 0 หรือ 1** = ทำแล้ว

### 8.2 Post-test
- **order_index > 0** (1, 2, 3, ...)
- **allow_retake = 1** (สามารถทำซ้ำได้)
- **ต้องดูวิดีโอที่เกี่ยวข้องครบ 100% ก่อน**
- **video.order_index = quiz.order_index**

### 8.3 Video
- **ต้องทำ Pre-test ก่อน**
- **is_complete = 1** = ดูครบ 100%
- **is_complete = 0** = ยังไม่ครบ 100%

## 9. Database Schema

### 9.1 Quizzes Table
```sql
quizzes:
  - quiz_id (PK)
  - module_id (FK)
  - title
  - time_limit
  - passing_score
  - allow_retake (0 = ไม่ให้ทำซ้ำ, 1 = ให้ทำซ้ำ)
  - order_index (0 = Pre-test, >0 = Post-test)
```

### 9.2 Quiz Results Table
```sql
quiz_results:
  - result_id (PK)
  - user_id (FK)
  - quiz_id (FK)
  - score (0-100)
  - passed (0 = ไม่ผ่าน, 1 = ผ่าน)
  - completed_at (timestamp)
```

### 9.3 Video Progress Table
```sql
video_progress:
  - progress_id (PK)
  - user_id (FK)
  - video_id (FK)
  - watch_time (seconds)
  - is_complete (0 = ยังไม่ครบ, 1 = ครบ 100%)
  - last_watched (timestamp)
```

