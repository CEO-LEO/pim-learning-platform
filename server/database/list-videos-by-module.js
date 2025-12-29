const db = require('./init');

console.log('📹 Videos by Module:\n');

// Get all modules
db.all('SELECT module_id, title FROM modules ORDER BY order_index', [], (err, modules) => {
  if (err) {
    console.error('❌ Error querying modules:', err.message);
    db.close();
    process.exit(1);
  }

  if (modules.length === 0) {
    console.log('⚠️  No modules found\n');
    db.close();
    return;
  }

  let moduleIndex = 0;

  modules.forEach((module) => {
    db.all(
      'SELECT video_id, title, order_index, url, duration FROM videos WHERE module_id = ? ORDER BY order_index',
      [module.module_id],
      (err, videos) => {
        if (err) {
          console.error(`❌ Error querying videos for ${module.module_id}:`, err.message);
          return;
        }

        console.log(`\n📦 ${module.module_id}: ${module.title}`);
        console.log('─'.repeat(60));
        
        if (videos.length === 0) {
          console.log('   ⚠️  ไม่มีวิดีโอ');
        } else {
          videos.forEach((video, index) => {
            const duration = video.duration ? `${Math.floor(video.duration / 60)} นาที` : 'ไม่ระบุ';
            const hasUrl = video.url && video.url.trim() !== '';
            const urlStatus = hasUrl ? '✅' : '❌';
            
            console.log(`   ${index + 1}. [Order ${video.order_index}] ${video.title}`);
            console.log(`      Duration: ${duration}`);
            console.log(`      URL: ${urlStatus} ${video.url || '(ไม่มี URL)'}`);
            console.log('');
          });
        }

        moduleIndex++;
        if (moduleIndex === modules.length) {
          console.log('─'.repeat(60));
          console.log(`\n📊 Summary:`);
          console.log(`   Total Modules: ${modules.length}`);
          const totalVideos = modules.reduce((sum, m) => {
            // This is approximate, actual count is done in the async callbacks
            return sum;
          }, 0);
          
          db.all('SELECT COUNT(*) as count FROM videos', [], (err, result) => {
            if (!err && result && result.length > 0) {
              console.log(`   Total Videos: ${result[0].count}`);
            }
            console.log('');
            db.close();
          });
        }
      }
    );
  });
});

