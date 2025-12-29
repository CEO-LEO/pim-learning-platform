const db = require('./init');

console.log('📹 All videos in database:\n');

db.all('SELECT video_id, module_id, title, order_index, url FROM videos ORDER BY module_id, order_index', [], (err, videos) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  const byModule = {};
  videos.forEach(video => {
    if (!byModule[video.module_id]) {
      byModule[video.module_id] = [];
    }
    byModule[video.module_id].push(video);
  });

  Object.keys(byModule).forEach(moduleId => {
    console.log(`\n📦 ${moduleId}:`);
    byModule[moduleId].forEach(video => {
      console.log(`   Order ${video.order_index}: ${video.title}`);
      console.log(`   URL: ${video.url || '(no URL)'}`);
    });
  });

  console.log(`\n📊 Total: ${videos.length} videos\n`);
  db.close();
});

