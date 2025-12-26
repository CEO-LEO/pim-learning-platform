const db = require('./init');

const moduleId = process.argv[2];
const orderIndex = parseInt(process.argv[3]);

if (!moduleId || !orderIndex) {
  console.log('Usage: node delete-video.js <module_id> <order_index>');
  console.log('Example: node delete-video.js module_2 2');
  process.exit(1);
}

db.serialize(() => {
  // Get video info first
  db.get(
    'SELECT video_id, url FROM videos WHERE module_id = ? AND order_index = ?',
    [moduleId, orderIndex],
    (err, video) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        process.exit(1);
      }

      if (!video) {
        console.log(`ℹ️  No video found at module_id=${moduleId}, order_index=${orderIndex}`);
        db.close();
        process.exit(0);
      }

      // Delete video progress
      db.run('DELETE FROM video_progress WHERE video_id = ?', [video.video_id], (err) => {
        if (err) console.error('⚠️  Error deleting video progress:', err.message);
        else console.log('✅ Deleted video progress records');
      });

      // Delete video
      db.run(
        'DELETE FROM videos WHERE video_id = ?',
        [video.video_id],
        function(err) {
          if (err) {
            console.error('❌ Error deleting video:', err.message);
            db.close();
            process.exit(1);
          }

          console.log(`✅ Deleted video: ${video.video_id}`);
          console.log(`   Module: ${moduleId}, Order: ${orderIndex}`);
          console.log(`   URL: ${video.url}`);
          console.log(`   Rows affected: ${this.changes}`);
          
          db.close();
          process.exit(0);
        }
      );
    }
  );
});

