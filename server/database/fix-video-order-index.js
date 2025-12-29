const db = require('./init');

console.log('📹 Fixing video order_index...\n');

// Get all videos grouped by module
db.all('SELECT video_id, module_id, title, order_index, url FROM videos ORDER BY module_id, order_index', [], (err, videos) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  // Group by module_id
  const byModule = {};
  videos.forEach(video => {
    if (!byModule[video.module_id]) {
      byModule[video.module_id] = [];
    }
    byModule[video.module_id].push(video);
  });

  let updated = 0;

  Object.keys(byModule).forEach(moduleId => {
    const moduleVideos = byModule[moduleId];
    
    // Sort by current order_index, then by title
    moduleVideos.sort((a, b) => {
      if (a.order_index !== b.order_index) {
        return (a.order_index || 0) - (b.order_index || 0);
      }
      return a.title.localeCompare(b.title);
    });

    console.log(`\n📦 Module: ${moduleId} (${moduleVideos.length} videos)`);

    // Reassign order_index sequentially
    moduleVideos.forEach((video, index) => {
      const newOrderIndex = index + 1;
      
      if (video.order_index !== newOrderIndex) {
        db.run(
          'UPDATE videos SET order_index = ? WHERE video_id = ?',
          [newOrderIndex, video.video_id],
          function(err) {
            if (err) {
              console.error(`❌ Error updating ${video.title}:`, err.message);
            } else {
              console.log(`   ✅ Order ${newOrderIndex}: ${video.title}`);
              updated++;
            }
          }
        );
      } else {
        console.log(`   ✓ Order ${newOrderIndex}: ${video.title}`);
      }
    });
  });

  setTimeout(() => {
    console.log(`\n📊 Summary: ${updated} videos updated\n`);
    db.close();
  }, 2000);
});

