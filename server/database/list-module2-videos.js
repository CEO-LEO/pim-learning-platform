const db = require('./init');

const moduleId = 'module_2';

db.all(
  'SELECT video_id, module_id, title, order_index FROM videos WHERE module_id = ? ORDER BY order_index',
  [moduleId],
  (err, videos) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📹 Videos in module ${moduleId}:`);
    console.log('================================================================================');
    if (videos.length === 0) {
      console.log('No videos found for this module.');
    } else {
      videos.forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Video ID: ${video.video_id}`);
        console.log(`   Order Index: ${video.order_index}`);
      });
    }
    console.log('================================================================================');
    
    db.close();
    process.exit(0);
  }
);

