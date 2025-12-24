const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Sample data seeder
async function seed() {
  console.log('🌱 Seeding database...');

  // Create sample student
  const studentPassword = await bcrypt.hash('student123', 10);
  const studentId = uuidv4();
  db.run(
    'INSERT OR IGNORE INTO users (user_id, student_id, name, email, password_hash, year_level, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [studentId, 'STU001', 'นักศึกษาตัวอย่าง', 'student@pim.ac.th', studentPassword, 1, 'student']
  );

  // Create sample videos for each module
  const modules = [
    { id: 'module_1', title: 'การบริการ' },
    { id: 'module_2', title: 'การเตรียมสินค้าอุ่นร้อน' },
    { id: 'module_3', title: 'การจัดการอุปกรณ์และความสะอาด' },
    { id: 'module_4', title: 'การจัดการและบริหารสินค้า' },
  ];

  modules.forEach((module, moduleIndex) => {
    // Create 3 videos per module
    for (let i = 1; i <= 3; i++) {
      const videoId = uuidv4();
      db.run(
        'INSERT OR IGNORE INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [
          videoId,
          module.id,
          `${module.title} - วิดีโอที่ ${i}`,
          '', // Empty URL - add actual video URLs here
          1800 + i * 300, // 30-40 minutes in seconds
          i,
        ]
      );
    }

    // Create pre-test (order_index = 0, allow_retake = 0)
    const pretestId = uuidv4();
    db.run(
      'INSERT OR IGNORE INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [pretestId, module.id, `แบบทดสอบก่อนเรียน - ${module.title}`, 30, 70, 0, 0]
    );

    // Create pre-test questions
    const pretestQuestions = [
      {
        question: `คำถามก่อนเรียนที่ 1 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4'],
        correct: 'ตัวเลือก 1',
      },
      {
        question: `คำถามก่อนเรียนที่ 2 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก A', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D'],
        correct: 'ตัวเลือก B',
      },
      {
        question: `คำถามก่อนเรียนที่ 3 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก X', 'ตัวเลือก Y', 'ตัวเลือก Z', 'ตัวเลือก W'],
        correct: 'ตัวเลือก Z',
      },
    ];

    pretestQuestions.forEach((q, qIndex) => {
      const questionId = uuidv4();
      db.run(
        'INSERT OR IGNORE INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          questionId,
          pretestId,
          q.question,
          'multiple_choice',
          JSON.stringify(q.options),
          q.correct,
          qIndex + 1,
        ]
      );
    });

    // Create post-test (order_index = 1, allow_retake = 1)
    const quizId = uuidv4();
    db.run(
      'INSERT OR IGNORE INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, allow_retake, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [quizId, module.id, `แบบทดสอบท้ายหลักสูตร - ${module.title}`, 30, 70, 1, 1]
    );

    // Create post-test questions
    const questions = [
      {
        question: `คำถามที่ 1 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4'],
        correct: 'ตัวเลือก 1',
      },
      {
        question: `คำถามที่ 2 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก A', 'ตัวเลือก B', 'ตัวเลือก C', 'ตัวเลือก D'],
        correct: 'ตัวเลือก B',
      },
      {
        question: `คำถามที่ 3 เกี่ยวกับ${module.title}`,
        options: ['ตัวเลือก X', 'ตัวเลือก Y', 'ตัวเลือก Z', 'ตัวเลือก W'],
        correct: 'ตัวเลือก Z',
      },
    ];

    questions.forEach((q, qIndex) => {
      const questionId = uuidv4();
      db.run(
        'INSERT OR IGNORE INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          questionId,
          quizId,
          q.question,
          'multiple_choice',
          JSON.stringify(q.options),
          q.correct,
          qIndex + 1,
        ]
      );
    });
  });

  // Create practical exam slots for Monday-Friday every week
  // Generate slots for the next 12 weeks
  const today = new Date();
  const slots = [];
  const timeSlots = [
    { start: '09:00', end: '12:00' },
    { start: '13:00', end: '16:00' }
  ];
  
  // Start from next Monday
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + daysUntilMonday);
  
  // Generate slots for 12 weeks (60 weekdays)
  for (let week = 0; week < 12; week++) {
    for (let day = 0; day < 5; day++) { // Monday (0) to Friday (4)
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      // Skip if date is in the past
      if (currentDate < today) continue;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Create slots for each time slot
      timeSlots.forEach((timeSlot) => {
        slots.push({
          date: dateStr,
          start: timeSlot.start,
          end: timeSlot.end
        });
      });
    }
  }

  slots.forEach((exam) => {
    const examId = uuidv4();
    db.run(
      'INSERT OR IGNORE INTO practical_exams (exam_id, date, start_time, end_time, limit_count, remaining_count, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [examId, exam.date, exam.start, exam.end, 100, 100, 'open']
    );
  });
  
  console.log(`✅ Created ${slots.length} practical exam slots for the next 12 weeks (Mon-Fri)`);

  console.log('✅ Database seeded successfully!');
}

// Run seeder manually if needed
// setTimeout(() => {
//   seed();
// }, 1000);

module.exports = seed;

