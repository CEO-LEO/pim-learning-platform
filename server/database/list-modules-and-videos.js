const db = require('./init');

console.log('📚 Modules and Videos:\n');
console.log('═'.repeat(70));

// Get all modules with their videos
db.all(`
  SELECT 
    m.module_id,
    m.title as module_title,
    m.order_index as module_order,
    v.video_id,
    v.title as video_title,
    v.order_index as video_order,
    v.url,
    v.duration
  FROM modules m
  LEFT JOIN videos v ON m.module_id = v.module_id
  ORDER BY m.order_index, v.order_index
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('⚠️  No data found\n');
    db.close();
    return;
  }

  // Group by module
  const modules = {};
  rows.forEach(row => {
    if (!modules[row.module_id]) {
      modules[row.module_id] = {
        module_id: row.module_id,
        title: row.module_title,
        order: row.module_order,
        videos: []
      };
    }
    
    if (row.video_id) {
      modules[row.module_id].videos.push({
        video_id: row.video_id,
        title: row.video_title,
        order: row.video_order,
        url: row.url,
        duration: row.duration
      });
    }
  });

  // Display results
  Object.values(modules).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(module => {
    console.log(`\n📦 ${module.module_id}: ${module.title}`);
    console.log('─'.repeat(70));
    
    if (module.videos.length === 0) {
      console.log('   ⚠️  ไม่มีวิดีโอ');
    } else {
      module.videos.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((video, index) => {
        const duration = video.duration ? `${Math.floor(video.duration / 60)} นาที` : 'ไม่ระบุ';
        const hasUrl = video.url && video.url.trim() !== '';
        const urlStatus = hasUrl ? '✅' : '❌';
        
        console.log(`   ${index + 1}. [Order ${video.order}] ${video.title}`);
        console.log(`      ⏱️  Duration: ${duration}`);
        console.log(`      🔗 URL: ${urlStatus} ${video.url || '(ไม่มี URL)'}`);
        console.log('');
      });
    }
  });

  console.log('═'.repeat(70));
  
  // Summary
  const totalModules = Object.keys(modules).length;
  const totalVideos = Object.values(modules).reduce((sum, m) => sum + m.videos.length, 0);
  const videosWithUrl = Object.values(modules).reduce((sum, m) => 
    sum + m.videos.filter(v => v.url && v.url.trim() !== '').length, 0
  , 0);

  console.log(`\n📊 Summary:`);
  console.log(`   📦 Total Modules: ${totalModules}`);
  console.log(`   🎥 Total Videos: ${totalVideos}`);
  console.log(`   ✅ Videos with URL: ${videosWithUrl}`);
  console.log(`   ❌ Videos without URL: ${totalVideos - videosWithUrl}`);
  console.log('');

  db.close();
});

