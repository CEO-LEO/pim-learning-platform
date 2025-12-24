const db = require('./init');

const moduleId = 'module_3';

console.log(`🧹 Cleaning up Module 3 quizzes to have ONLY 1 quiz...`);

db.serialize(() => {
  db.all('SELECT quiz_id, title, order_index FROM quizzes WHERE module_id = ? ORDER BY order_index', [moduleId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching quizzes:', err.message);
      db.close();
      process.exit(1);
    }

    const quizzesToDelete = rows.filter(r => r.order_index !== 1);
    const idsToDelete = quizzesToDelete.map(v => v.quiz_id);

    if (idsToDelete.length === 0) {
      console.log('✅ Only Quiz 1 remains. No action needed.');
      db.close();
      process.exit(0);
      return;
    }

    console.log(`📋 Found ${idsToDelete.length} other quizzes to delete.`);

    const placeholders = idsToDelete.map(() => '?').join(',');

    db.run(`DELETE FROM quiz_results WHERE quiz_id IN (${placeholders})`, idsToDelete, (err) => {
      if (err) console.error('❌ Error deleting results:', err.message);
      
      db.run(`DELETE FROM quiz_questions WHERE quiz_id IN (${placeholders})`, idsToDelete, (err) => {
        if (err) console.error('❌ Error deleting questions:', err.message);
        
        db.run(`DELETE FROM quizzes WHERE quiz_id IN (${placeholders})`, idsToDelete, function(err) {
          if (err) console.error('❌ Error deleting quizzes:', err.message);
          else console.log(`✅ Deleted ${this.changes} duplicate/extra quizzes.`);

          console.log('\n🎉 Module 3 is now clean with ONLY 1 video and 1 quiz!');
          db.close();
          process.exit(0);
        });
      });
    });
  });
});

