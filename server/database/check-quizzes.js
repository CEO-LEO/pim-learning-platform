const db = require('./init');

const moduleId = process.argv[2] || 'module_1';

db.all(
  'SELECT quiz_id, module_id, title, time_limit, passing_score FROM quizzes WHERE module_id = ? ORDER BY quiz_id',
  [moduleId],
  (err, quizzes) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📝 Quizzes in module ${moduleId}:`);
    console.log('================================================================================');
    if (quizzes.length === 0) {
      console.log('No quizzes found for this module.');
    } else {
      quizzes.forEach((quiz, index) => {
        console.log(`\n${index + 1}. ${quiz.title}`);
        console.log(`   Quiz ID: ${quiz.quiz_id}`);
        console.log(`   Time Limit: ${quiz.time_limit} minutes`);
        console.log(`   Passing Score: ${quiz.passing_score}%`);
      });
    }
    console.log('\n================================================================================');
    
    db.close();
    process.exit(0);
  }
);

