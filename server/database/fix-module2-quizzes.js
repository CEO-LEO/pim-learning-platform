const db = require('./init');
const { v4: uuidv4 } = require('uuid');

const moduleId = 'module_2';

console.log(`🔧 Fixing quizzes for module: ${moduleId}...`);

db.serialize(() => {
  // 1. Get all quizzes for the module
  db.all('SELECT quiz_id, title, order_index FROM quizzes WHERE module_id = ? ORDER BY order_index, quiz_id', [moduleId], (err, quizzes) => {
    if (err) {
      console.error('❌ Error fetching quizzes:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📋 Found ${quizzes.length} quizzes in module ${moduleId}`);

    let quiz1Id = null;

    // Try to find existing quiz 1
    const existingQuiz1 = quizzes.find(q => q.order_index === 1);

    if (existingQuiz1) {
      quiz1Id = existingQuiz1.quiz_id;
      db.run('UPDATE quizzes SET title = ?, order_index = ? WHERE quiz_id = ?', ['แบบทดสอบ - การเตรียมสินค้าอุ่นร้อน', 1, quiz1Id], function(err) {
        if (err) console.error('❌ Error updating quiz 1:', err.message);
        else console.log(`✅ Updated quiz 1: ${existingQuiz1.title} (order_index = 1)`);
      });
    } else if (quizzes.length > 0) {
      // If no quiz 1, use the first available quiz as quiz 1
      quiz1Id = quizzes[0].quiz_id;
      db.run('UPDATE quizzes SET title = ?, order_index = ? WHERE quiz_id = ?', ['แบบทดสอบ - การเตรียมสินค้าอุ่นร้อน', 1, quiz1Id], function(err) {
        if (err) console.error('❌ Error updating first quiz to be quiz 1:', err.message);
        else console.log(`✅ Updated first quiz to be quiz 1: ${quizzes[0].title} (order_index = 1)`);
      });
    } else {
      // If no quizzes at all, create quiz 1
      quiz1Id = uuidv4();
      db.run('INSERT INTO quizzes (quiz_id, module_id, title, time_limit, passing_score, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [quiz1Id, moduleId, 'แบบทดสอบ - การเตรียมสินค้าอุ่นร้อน', 30, 70, 1], function(err) {
          if (err) console.error('❌ Error creating quiz 1:', err.message);
          else console.log(`✅ Created quiz 1: แบบทดสอบ - การเตรียมสินค้าอุ่นร้อน (order_index = 1)`);
        });
      // Add some dummy questions for quiz 1
      for (let i = 1; i <= 3; i++) {
        db.run('INSERT INTO quiz_questions (question_id, quiz_id, question, type, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), quiz1Id, `คำถามที่ ${i} สำหรับการเตรียมสินค้าอุ่นร้อน`, 'multiple-choice', JSON.stringify(['ตัวเลือก A', 'ตัวเลือก B', 'ตัวเลือก C']), 'ตัวเลือก A', i]);
      }
    }

    // Delete all quiz results and questions for quizzes other than quiz1Id
    const quizzesToDelete = quizzes.filter(q => q.quiz_id !== quiz1Id);
    const quizIdsToDelete = quizzesToDelete.map(q => q.quiz_id);

    if (quizIdsToDelete.length > 0) {
      const placeholders = quizIdsToDelete.map(() => '?').join(',');
      db.run(`DELETE FROM quiz_results WHERE quiz_id IN (${placeholders})`, quizIdsToDelete, function(err) {
        if (err) console.error('❌ Error deleting quiz results:', err.message);
        else console.log(`✅ Deleted ${this.changes} quiz results`);
      });
      db.run(`DELETE FROM quiz_questions WHERE quiz_id IN (${placeholders})`, quizIdsToDelete, function(err) {
        if (err) console.error('❌ Error deleting quiz questions:', err.message);
        else console.log(`✅ Deleted ${this.changes} quiz questions`);
      });
      db.run(`DELETE FROM quizzes WHERE quiz_id IN (${placeholders})`, quizIdsToDelete, function(err) {
        if (err) console.error('❌ Error deleting duplicate quizzes:', err.message);
        else console.log(`✅ Deleted ${this.changes} duplicate quizzes`);
      });
    }

    console.log('\n🎉 Quiz setup completed for Module 2!');
    console.log(`   - Quiz 1: ${quiz1Id} (order_index = 1)`);
    db.close();
  });
});

