const db = require('./init');

const moduleId = process.argv[2] || 'module_1';

db.all(
  `SELECT qr.quiz_id, qr.user_id, qr.score, qr.passed, qr.completed_at, q.order_index, q.title
   FROM quiz_results qr 
   JOIN quizzes q ON qr.quiz_id = q.quiz_id 
   WHERE q.module_id = ? 
   ORDER BY qr.completed_at DESC`,
  [moduleId],
  (err, results) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📝 Quiz results for module ${moduleId}:`);
    console.log('================================================================================');
    if (results.length === 0) {
      console.log('No quiz results found for this module.');
    } else {
      results.forEach((r, index) => {
        console.log(`\n${index + 1}. Quiz ${r.order_index} (${r.title})`);
        console.log(`   User ID: ${r.user_id}`);
        console.log(`   Score: ${r.score}%`);
        console.log(`   Passed: ${r.passed === 1 ? 'Yes' : 'No'}`);
        console.log(`   Completed: ${r.completed_at}`);
      });
    }
    console.log('\n================================================================================');
    
    db.close();
    process.exit(0);
  }
);

