const db = require('./init');
const { v4: uuidv4 } = require('uuid');

const moduleId = 'module_4';
const videoUrl = '/uploads/videos/store-model-101-video8.mp4';
const duration = 215; // 3 minutes 35 seconds

console.log(`🔧 Adding Video 3 and Quiz 3 for Module 4...`);

db.serialize(() => {
  // 1. Add Video 3
  const videoId = uuidv4();
  db.run(
    'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [
      videoId,
      moduleId,
      'การจัดการและบริหารสินค้า - วิดีโอที่ 3',
      videoUrl,
      duration,
      3
    ],
    function(err) {
      if (err) {
        console.error('❌ Error adding video 3:', err.message);
      } else {
        console.log(`✅ Added Video 3: ${videoUrl} (${duration}s)`);
      }
    }
  );

  // 2. Add Quiz 3
  const quizId = uuidv4();
  db.run(
    'INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [quizId, moduleId, 'แบบทดสอบ - การจัดการและบริหารสินค้า (แบบทดสอบสุดท้าย)', 30, 70, 3],
    function(err) {
      if (err) {
        console.error('❌ Error adding quiz 3:', err.message);
      } else {
        console.log(`✅ Added Quiz 3 for Module 4`);
        
        // Add sample questions for Quiz 3
        for (let i = 1; i <= 3; i++) {
          db.run(
            'INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), quizId, `คำถามที่ ${i} สำหรับการจัดการและบริหารสินค้า (ส่วนที่ 3)`, 'multiple-choice', JSON.stringify(['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3']), 'ตัวเลือก 1', i]
          );
        }
        console.log('✅ Added 3 questions for Quiz 3');
      }
    }
  );

  // 3. Rename Quiz 2 to not say "final" anymore if it did
  db.run("UPDATE quizzes SET title = 'แบบทดสอบ - การจัดการและบริหารสินค้า (แบบทดสอบที่ 2)' WHERE module_id = ? AND order_index = 2", [moduleId]);
});

setTimeout(() => {
  console.log('\n🎉 Finished updating Module 4 with 3 videos and 3 quizzes!');
  db.close();
}, 2000);

