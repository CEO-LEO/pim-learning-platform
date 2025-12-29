const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const videosDir = path.join(__dirname, '..', 'uploads', 'videos');

console.log('📹 Adding all videos from folder to database...\n');

if (!fs.existsSync(videosDir)) {
  console.error('❌ Videos directory not found:', videosDir);
  process.exit(1);
}

const videoFiles = fs.readdirSync(videosDir).filter(file => 
  file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
);

console.log(`Found ${videoFiles.length} video files\n`);

// Get existing videos to avoid duplicates
db.all('SELECT module_id, order_index, url FROM videos', [], (err, existingVideos) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  const existingUrls = new Set(existingVideos.map(v => v.url));
  const existingKeys = new Set(existingVideos.map(v => `${v.module_id}-${v.order_index}`));

  // Get all modules
  db.all('SELECT module_id, title FROM modules ORDER BY order_index', [], (err, modules) => {
    if (err) {
      console.error('❌ Error querying modules:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('Available modules:');
    modules.forEach(m => {
      console.log(`  - ${m.module_id}: ${m.title}`);
    });
    console.log('');

    let added = 0;
    let skipped = 0;

    videoFiles.forEach((file, index) => {
      const videoUrl = `/uploads/videos/${file}`;
      
      // Skip if URL already exists
      if (existingUrls.has(videoUrl)) {
        console.log(`⏭️  Skipped (already exists): ${file}`);
        skipped++;
        return;
      }

      // Try to extract module_id and order_index from filename
      let moduleId = null;
      let orderIndex = null;

      // Pattern 1: video-module_1-1.mp4
      const match1 = file.match(/video-module_(\d+)-(\d+)\.mp4/i);
      if (match1) {
        moduleId = `module_${match1[1]}`;
        orderIndex = parseInt(match1[2]);
      }

      // Pattern 2: video-module-1-1.mp4
      const match2 = file.match(/video-module-(\d+)-(\d+)\.mp4/i);
      if (match2) {
        moduleId = `module_${match2[1]}`;
        orderIndex = parseInt(match2[2]);
      }

      // Pattern 3: store-model-101.mp4 or store-model-101-video2.mp4
      const match3 = file.match(/store-model-101(?:-video(\d+))?\.mp4/i);
      if (match3) {
        moduleId = 'module_1'; // Default to module_1 for store-model videos
        orderIndex = match3[1] ? parseInt(match3[1]) : 1;
      }

      // If no pattern matched, use first module and auto-increment
      if (!moduleId) {
        moduleId = modules[0]?.module_id || 'module_1';
        // Find next available order_index for this module
        const moduleVideos = existingVideos.filter(v => v.module_id === moduleId);
        const maxOrder = moduleVideos.length > 0 
          ? Math.max(...moduleVideos.map(v => v.order_index || 0))
          : 0;
        orderIndex = maxOrder + 1;
      }

      // Check if this module_id + order_index combination already exists
      const key = `${moduleId}-${orderIndex}`;
      if (existingKeys.has(key)) {
        // Find next available order_index
        const moduleVideos = existingVideos.filter(v => v.module_id === moduleId);
        const maxOrder = moduleVideos.length > 0 
          ? Math.max(...moduleVideos.map(v => v.order_index || 0))
          : 0;
        orderIndex = maxOrder + 1;
      }

      const videoId = uuidv4();
      const title = file.replace(/\.(mp4|webm|mov)$/i, '').replace(/-/g, ' ');

      db.run(
        'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [videoId, moduleId, title, videoUrl, 1800, orderIndex], // Default duration 30 minutes
        function(err) {
          if (err) {
            console.error(`❌ Error adding ${file}:`, err.message);
          } else {
            console.log(`✅ Added: ${file}`);
            console.log(`   Module: ${moduleId}, Order: ${orderIndex}`);
            console.log(`   Title: ${title}`);
            console.log(`   URL: ${videoUrl}\n`);
            added++;
            existingKeys.add(key);
            existingVideos.push({ module_id: moduleId, order_index: orderIndex, url: videoUrl });
          }
        }
      );
    });

    setTimeout(() => {
      console.log('\n📊 Summary:');
      console.log(`   ✅ Added: ${added}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
      console.log(`   📁 Total files: ${videoFiles.length}\n`);
      
      if (added > 0) {
        console.log('💡 Note: Videos have default duration of 30 minutes.');
        console.log('   You can update duration later if needed.\n');
      }
      
      db.close();
    }, 2000);
  });
});

