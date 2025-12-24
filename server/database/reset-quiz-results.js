const db = require('./init');

console.log('🔄 Resetting all quiz results and video progress...');

// Delete all quiz results
db.run('DELETE FROM quiz_results', (err) => {
  if (err) {
    console.error('❌ Error deleting quiz results:', err.message);
    process.exit(1);
  }
  
  console.log('✅ All quiz results deleted successfully!');
  
  // Delete all video progress
  db.run('DELETE FROM video_progress', (err) => {
    if (err) {
      console.error('❌ Error deleting video progress:', err.message);
      process.exit(1);
    }
    
    console.log('✅ All video progress deleted successfully!');
    console.log('📝 Users can now retake all quizzes and rewatch all videos');
    
    // Verify deletion
    db.get('SELECT COUNT(*) as quiz_count FROM quiz_results', (err, quizRow) => {
      if (err) {
        console.error('❌ Error checking quiz results:', err.message);
      } else {
        console.log(`📊 Remaining quiz results: ${quizRow.quiz_count}`);
      }
      
      db.get('SELECT COUNT(*) as video_count FROM video_progress', (err, videoRow) => {
        if (err) {
          console.error('❌ Error checking video progress:', err.message);
        } else {
          console.log(`📊 Remaining video progress: ${videoRow.video_count}`);
        }
        process.exit(0);
      });
    });
  });
});

