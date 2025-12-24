const db = require('./init');

const moduleId = 'module_2';
const keepVideoId = 'db9b830f-c6ae-4fb3-8d55-740f3578c65c';

console.log(`🧹 Cleaning up Module 2 to have ONLY 1 video (ID: ${keepVideoId})...`);

db.serialize(() => {
  // 1. Get all videos for module_2
  db.all('SELECT video_id, title, order_index, url FROM videos WHERE module_id = ?', [moduleId], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching videos:', err.message);
      db.close();
      process.exit(1);
    }

    const videosToDelete = rows.filter(r => r.video_id !== keepVideoId);
    const idsToDelete = videosToDelete.map(v => v.video_id);

    if (idsToDelete.length === 0) {
      console.log('✅ No other videos found to delete.');
      db.close();
      process.exit(0);
      return;
    }

    console.log(`📋 Found ${idsToDelete.length} other videos to delete.`);

    const placeholders = idsToDelete.map(() => '?').join(',');

    // Delete progress first
    db.run(`DELETE FROM video_progress WHERE video_id IN (${placeholders})`, idsToDelete, function(err) {
      if (err) console.error('❌ Error deleting progress:', err.message);
      else console.log(`✅ Deleted ${this.changes} progress records.`);

      // Delete videos
      db.run(`DELETE FROM videos WHERE video_id IN (${placeholders})`, idsToDelete, function(err) {
        if (err) console.error('❌ Error deleting videos:', err.message);
        else console.log(`✅ Deleted ${this.changes} videos.`);

        console.log('\n🎉 Module 2 is now clean with ONLY Video 1!');
        db.close();
        process.exit(0);
      });
    });
  });
});

