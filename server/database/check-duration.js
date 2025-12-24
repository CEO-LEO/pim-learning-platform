const db = require('./init');

const moduleId = process.argv[2] || 'module_1';

db.all(
  'SELECT video_id, title, url, duration, order_index FROM videos WHERE module_id = ? AND url IS NOT NULL AND url != "" ORDER BY order_index',
  [moduleId],
  (err, videos) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📹 Videos with URLs in module ${moduleId}:`);
    console.log('================================================================================');
    if (videos.length === 0) {
      console.log('No videos with URLs found for this module.');
    } else {
      videos.forEach((video, index) => {
        console.log(`\n${index + 1}. ${video.title}`);
        console.log(`   Video ID: ${video.video_id}`);
        console.log(`   Order: ${video.order_index}`);
        console.log(`   URL: ${video.url}`);
        console.log(`   Duration: ${Math.floor(video.duration / 60)} นาที (${video.duration} วินาที)`);
      });
    }
    console.log('\n================================================================================');
    console.log('\n💡 Duration จะอัพเดทอัตโนมัติเมื่อเปิดวิดีโอครั้งแรก');
    console.log('   หรือสามารถอัพเดทได้โดยเปิดวิดีโอในเบราว์เซอร์');
    
    db.close();
    process.exit(0);
  }
);

