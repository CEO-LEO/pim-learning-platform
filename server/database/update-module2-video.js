const db = require('./init');

const moduleId = 'module_2';
const videoUrl = '/uploads/videos/store-model-101-video3.mp4';
const duration = 189; // 3 minutes 9 seconds

console.log('🔧 Updating video for Module 2...');

db.all(
  'SELECT video_id FROM videos WHERE module_id = ? AND order_index = 1',
  [moduleId],
  (err, rows) => {
    if (err) {
      console.error('❌ Error fetching videos:', err.message);
      db.close();
      process.exit(1);
    }

    if (rows.length === 0) {
      console.error('❌ No video found for module_2, order_index 1');
      db.close();
      process.exit(1);
    }

    const mainVideoId = rows[0].video_id;
    const extraVideoIds = rows.slice(1).map(r => r.video_id);

    console.log(`✅ Main video ID: ${mainVideoId}`);
    
    // Update the main video
    db.run(
      'UPDATE videos SET url = ?, duration = ? WHERE video_id = ?',
      [videoUrl, duration, mainVideoId],
      function(err) {
        if (err) {
          console.error('❌ Error updating video:', err.message);
        } else {
          console.log(`✅ Updated main video with URL: ${videoUrl} and Duration: ${duration}s`);
        }

        // Cleanup duplicates if any
        if (extraVideoIds.length > 0) {
          const placeholders = extraVideoIds.map(() => '?').join(',');
          
          // Delete from video_progress first
          db.run(
            `DELETE FROM video_progress WHERE video_id IN (${placeholders})`,
            extraVideoIds,
            function(err) {
              if (err) console.error('❌ Error deleting progress:', err.message);
              
              // Delete from videos
              db.run(
                `DELETE FROM videos WHERE video_id IN (${placeholders})`,
                extraVideoIds,
                function(err) {
                  if (err) {
                    console.error('❌ Error deleting duplicate videos:', err.message);
                  } else {
                    console.log(`✅ Deleted ${this.changes} duplicate videos`);
                  }
                  console.log('\n🎉 Finished updating Module 2, Video 1!');
                  db.close();
                  process.exit(0);
                }
              );
            }
          );
        } else {
          console.log('\n🎉 Finished updating Module 2, Video 1!');
          db.close();
          process.exit(0);
        }
      }
    );
  }
);

