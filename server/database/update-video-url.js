const db = require('./init');
const path = require('path');

// Get command line arguments
const videoPath = process.argv[2];
const moduleId = process.argv[3] || 'module_1';
const orderIndex = parseInt(process.argv[4]) || 1;

if (!videoPath) {
  console.log('📹 Video URL Updater');
  console.log('\nUsage:');
  console.log('  node update-video-url.js <video-path> [module_id] [order_index]');
  console.log('\nExample:');
  console.log('  node update-video-url.js "/uploads/videos/video.mp4" module_1 1');
  console.log('  node update-video-url.js "https://youtube.com/embed/xxx" module_1 1');
  process.exit(1);
}

// Find video by module_id and order_index
db.get(
  'SELECT video_id, title FROM videos WHERE module_id = ? AND order_index = ?',
  [moduleId, orderIndex],
  (err, video) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    if (!video) {
      console.error(`❌ Video not found: module_id=${moduleId}, order_index=${orderIndex}`);
      console.log('\n💡 Available videos:');
      db.all(
        'SELECT video_id, title, order_index, url FROM videos WHERE module_id = ? ORDER BY order_index',
        [moduleId],
        (err, videos) => {
          if (err) {
            console.error('Error:', err.message);
          } else {
            videos.forEach(v => {
              console.log(`  ${v.order_index}. ${v.title} (${v.video_id})`);
            });
          }
          db.close();
          process.exit(1);
        }
      );
      return;
    }

    // Update video URL
    db.run(
      'UPDATE videos SET url = ? WHERE video_id = ?',
      [videoPath, video.video_id],
      function(updateErr) {
        if (updateErr) {
          console.error('❌ Error updating video:', updateErr.message);
          db.close();
          process.exit(1);
        }

        console.log('✅ Video URL updated successfully!');
        console.log(`\n📹 Video: ${video.title}`);
        console.log(`   Video ID: ${video.video_id}`);
        console.log(`   Module: ${moduleId}`);
        console.log(`   Order: ${orderIndex}`);
        console.log(`   URL: ${videoPath}`);
        console.log(`\n💡 Video will be accessible at: http://localhost:5000${videoPath}`);
        
        db.close();
        process.exit(0);
      }
    );
  }
);

