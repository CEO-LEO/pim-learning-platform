const db = require('./init');

const moduleId = process.argv[2] || 'module_1';

db.all(
  'SELECT video_id, module_id, title, url, order_index, duration FROM videos WHERE module_id = ? ORDER BY order_index',
  [moduleId],
  (err, videos) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📹 Videos in module ${moduleId}:`);
    console.log('='.repeat(80));
    videos.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.title}`);
      console.log(`   Video ID: ${v.video_id}`);
      console.log(`   Order: ${v.order_index}`);
      console.log(`   URL: ${v.url || '(empty)'}`);
      console.log(`   Duration: ${v.duration ? Math.floor(v.duration / 60) + ' นาที' : 'N/A'}`);
    });
    console.log('\n' + '='.repeat(80));
    
    db.close();
    process.exit(0);
  }
);

