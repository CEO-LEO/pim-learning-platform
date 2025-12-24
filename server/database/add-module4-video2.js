const db = require('./init');
const { v4: uuidv4 } = require('uuid');

const moduleId = 'module_4';
const videoUrl = '/uploads/videos/store-model-101-video7.mp4';
const duration = 220; // 3 minutes 40 seconds

console.log(`🔧 Adding Video 2 and Quiz 2 for Module 4...`);

db.serialize(() => {
  // 1. Add Video 2
  const videoId = uuidv4();
  db.run(
    'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [
      videoId,
      moduleId,
      'การจัดการและบริหารสินค้า - วิดีโอที่ 2',
      videoUrl,
      duration,
      2
    ],
    function(err) {
      if (err) {
        console.error('❌ Error adding video 2:', err.message);
      } else {
        console.log(`✅ Added Video 2: ${videoUrl} (${duration}s)`);
      }
    }
  );

  // 2. Add Quiz 2
  const quizId = uuidv4();
  db.run(
    'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [quizId, moduleId, 'แบบทดสอบ - การจัดการและบริหารสินค้า (แบบทดสอบที่ 2)', 30, 70, 2],
    function(err) {
      if (err) {
        console.error('❌ Error adding quiz 2:', err.message);
      } else {
        console.log(`✅ Added Quiz 2 for Module 4`);
        
        // Add sample questions for Quiz 2
        for (let i = 1; i <= 3; i++) {
          db.run(
            'INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), quizId, `คำถามที่ ${i} สำหรับการจัดการและบริหารสินค้า (ส่วนที่ 2)`, 'multiple-choice', JSON.stringify(['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3']), 'ตัวเลือก 1', i]
          );
        }
        console.log('✅ Added 3 questions for Quiz 2');
      }
    }
  );
});

setTimeout(() => {
  console.log('\n🎉 Finished updating Module 4 with 2 videos and 2 quizzes!');
  db.close();
}, 2000);

