const db = require('./init');

const moduleId = 'module_2';

db.all('SELECT video_id, order_index FROM videos WHERE module_id = ? AND url IS NOT NULL AND url != ""', [moduleId], (err, videos) => {
  if (err) { console.error(err); db.close(); return; }
  console.log(`📹 Module 2 has ${videos.length} video(s).`);
  
  db.all('SELECT quiz_id, order_index FROM quizzes WHERE module_id = ?', [moduleId], (err, quizzes) => {
    if (err) { console.error(err); db.close(); return; }
    console.log(`📝 Module 2 has ${quizzes.length} quiz(zes).`);
    quizzes.forEach(q => console.log(`   - Quiz ID: ${q.quiz_id}, Order Index: ${q.order_index}`));
    db.close();
  });
});

