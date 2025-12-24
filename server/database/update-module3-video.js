const db = require('./init');

const moduleId = 'module_3';
const videoUrl = '/uploads/videos/store-model-101-video4.mp4';
const duration = 299; // 4 minutes 59 seconds
const mainVideoId = '6e108d67-f847-4e1b-9458-399040500e77';

console.log(`🔧 Updating video for Module 3 (Video ID: ${mainVideoId})...`);

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

      // 2. Get all other videos in module_3 to delete
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
            
            // Delete progress first
            db.run(`DELETE FROM video_progress WHERE video_id IN (${placeholders})`, idsToDelete, (err) => {
              if (err) console.error('❌ Error deleting progress:', err.message);
              
              // Delete videos
              db.run(`DELETE FROM videos WHERE video_id IN (${placeholders})`, idsToDelete, function(err) {
                if (err) console.error('❌ Error deleting videos:', err.message);
                else console.log(`✅ Deleted ${this.changes} duplicate videos`);
                
                finish();
              });
            });
          } else {
            finish();
          }
        }
      );
    }
  );
});

function finish() {
  console.log('\n🎉 Finished updating Module 3!');
  db.close();
  process.exit(0);
}

