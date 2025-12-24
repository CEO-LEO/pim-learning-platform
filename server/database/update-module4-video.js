const db = require('./init');

const moduleId = 'module_4';
const videoUrl = '/uploads/videos/store-model-101-video6.mp4';
const duration = 102; // 1 minute 42 seconds
const mainVideoId = 'd2d1c7a0-4511-4df1-a96d-219a8ff79f5f';

console.log(`🔧 Updating video for Module 4 (Video ID: ${mainVideoId})...`);

db.serialize(() => {
  // 1. Update the main video
  db.run(
    'UPDATE videos SET url = ?, duration = ? WHERE video_id = ?',
    [videoUrl, duration, mainVideoId],
    function(err) {
      if (err) {
        console.error('❌ Error updating video:', err.message);
        db.close();
        process.exit(1);
      }
      console.log(`✅ Updated main video with URL: ${videoUrl} and Duration: ${duration}s`);

      // 2. Get all other videos in module_4 to delete
      db.all(
        'SELECT video_id FROM videos WHERE module_id = ? AND video_id != ?',
        [moduleId, mainVideoId],
        (err, rows) => {
          if (err) {
            console.error('❌ Error fetching duplicate videos:', err.message);
            db.close();
            process.exit(1);
          }

          const idsToDelete = rows.map(r => r.video_id);
          console.log(`📋 Found ${idsToDelete.length} duplicate videos to delete.`);

          if (idsToDelete.length > 0) {
            const placeholders = idsToDelete.map(() => '?').join(',');
            
            db.run(`DELETE FROM video_progress WHERE video_id IN (${placeholders})`, idsToDelete, (err) => {
              if (err) console.error('❌ Error deleting progress:', err.message);
              
              db.run(`DELETE FROM videos WHERE video_id IN (${placeholders})`, idsToDelete, function(err) {
                if (err) console.error('❌ Error deleting videos:', err.message);
                else console.log(`✅ Deleted ${this.changes} duplicate videos`);
                
                cleanupQuizzes();
              });
            });
          } else {
            cleanupQuizzes();
          }
        }
      );
    }
  );
});

function cleanupQuizzes() {
  console.log(`\n🧹 Cleaning up Module 4 quizzes...`);
  
  db.all('SELECT quiz_id, title, order_index FROM quizzes WHERE module_id = ? ORDER BY order_index, quiz_id', [moduleId], (err, quizzes) => {
    if (err) {
      console.error('❌ Error fetching quizzes:', err.message);
      finish();
      return;
    }

    console.log(`📋 Found ${quizzes.length} quizzes in module ${moduleId}`);

    // Keep only the first quiz and set its order_index to 1
    if (quizzes.length > 0) {
      const keepQuizId = quizzes[0].quiz_id;
      const otherQuizIds = quizzes.slice(1).map(q => q.quiz_id);

      db.run('UPDATE quizzes SET title = ?, order_index = ? WHERE quiz_id = ?', ['แบบทดสอบ - การจัดการและบริหารสินค้า', 1, keepQuizId], (err) => {
        if (err) console.error('❌ Error updating main quiz:', err.message);
        else console.log(`✅ Updated main quiz (order_index = 1)`);

        if (otherQuizIds.length > 0) {
          const placeholders = otherQuizIds.map(() => '?').join(',');
          
          db.run(`DELETE FROM quiz_results WHERE quiz_id IN (${placeholders})`, otherQuizIds, (err) => {
            db.run(`DELETE FROM quiz_questions WHERE quiz_id IN (${placeholders})`, otherQuizIds, (err) => {
              db.run(`DELETE FROM quizzes WHERE quiz_id IN (${placeholders})`, otherQuizIds, function(err) {
                if (err) console.error('❌ Error deleting duplicate quizzes:', err.message);
                else console.log(`✅ Deleted ${this.changes} duplicate quizzes`);
                finish();
              });
            });
          });
        } else {
          finish();
        }
      });
    } else {
      console.log('No quizzes found to cleanup.');
      finish();
    }
  });
}

function finish() {
  console.log('\n🎉 Finished updating Module 4!');
  db.close();
  process.exit(0);
}

