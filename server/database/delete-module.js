const db = require('./init');

const moduleId = process.argv[2] || 'module_5';

if (!moduleId) {
  console.error('Usage: node delete-module.js <module_id>');
  process.exit(1);
}

console.log(`🗑️  Deleting module: ${moduleId}...`);

// First, check if module exists
db.get('SELECT * FROM modules WHERE module_id = ?', [moduleId], (err, module) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    db.close();
    process.exit(1);
  }

  if (!module) {
    console.error(`❌ Module ${moduleId} not found`);
    db.close();
    process.exit(1);
  }

  console.log(`📋 Module: ${module.title}`);

  // Delete in order: quiz_results -> quiz_questions -> quizzes -> video_progress -> videos -> learning_hours -> modules
  // 1. Delete quiz results
  db.run(
    `DELETE FROM quiz_results WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE module_id = ?)`,
    [moduleId],
    function(err) {
      if (err) {
        console.error('❌ Error deleting quiz results:', err.message);
      } else {
        console.log(`✅ Deleted ${this.changes} quiz results`);
      }

      // 2. Delete quiz questions
      db.run(
        `DELETE FROM quiz_questions WHERE quiz_id IN (SELECT quiz_id FROM quizzes WHERE module_id = ?)`,
        [moduleId],
        function(err) {
          if (err) {
            console.error('❌ Error deleting quiz questions:', err.message);
          } else {
            console.log(`✅ Deleted ${this.changes} quiz questions`);
          }

          // 3. Delete quizzes
          db.run('DELETE FROM quizzes WHERE module_id = ?', [moduleId], function(err) {
            if (err) {
              console.error('❌ Error deleting quizzes:', err.message);
            } else {
              console.log(`✅ Deleted ${this.changes} quizzes`);
            }

            // 4. Delete video progress
            db.run(
              `DELETE FROM video_progress WHERE video_id IN (SELECT video_id FROM videos WHERE module_id = ?)`,
              [moduleId],
              function(err) {
                if (err) {
                  console.error('❌ Error deleting video progress:', err.message);
                } else {
                  console.log(`✅ Deleted ${this.changes} video progress records`);
                }

                // 5. Delete videos
                db.run('DELETE FROM videos WHERE module_id = ?', [moduleId], function(err) {
                  if (err) {
                    console.error('❌ Error deleting videos:', err.message);
                  } else {
                    console.log(`✅ Deleted ${this.changes} videos`);
                  }

                  // 6. Delete learning hours
                  db.run('DELETE FROM learning_hours WHERE module_id = ?', [moduleId], function(err) {
                    if (err) {
                      console.error('❌ Error deleting learning hours:', err.message);
                    } else {
                      console.log(`✅ Deleted ${this.changes} learning hours records`);
                    }

                    // 7. Delete module
                    db.run('DELETE FROM modules WHERE module_id = ?', [moduleId], function(err) {
                      if (err) {
                        console.error('❌ Error deleting module:', err.message);
                        db.close();
                        process.exit(1);
                      } else {
                        console.log(`✅ Deleted module: ${module.title}`);
                        console.log('\n🎉 Module and all related data deleted successfully!');
                        db.close();
                        process.exit(0);
                      }
                    });
                  });
                });
              }
            );
          });
        }
      );
    }
  );
});

