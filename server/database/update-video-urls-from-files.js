const db = require('./init');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, '..', 'uploads', 'videos');

console.log('📹 Updating video URLs from existing files...\n');

// Get all video files in the directory
if (!fs.existsSync(videosDir)) {
  console.error('❌ Videos directory not found:', videosDir);
  process.exit(1);
}

const videoFiles = fs.readdirSync(videosDir).filter(file => 
  file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
);

console.log(`Found ${videoFiles.length} video files:\n`);
videoFiles.forEach(file => {
  console.log(`  - ${file}`);
});

console.log('\n📋 Checking database for videos...\n');

// Get all videos from database
db.all('SELECT video_id, module_id, title, url, order_index FROM videos ORDER BY module_id, order_index', [], (err, videos) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`Found ${videos.length} videos in database\n`);

  let updated = 0;
  let notFound = 0;

  // Try to match files with videos
  videos.forEach(video => {
    // Try different naming patterns
    const patterns = [
      `video-${video.module_id}-${video.order_index}.mp4`,
      `video-${video.module_id}_${video.order_index}.mp4`,
      `${video.module_id}-${video.order_index}.mp4`,
      `${video.module_id}_${video.order_index}.mp4`,
      `module-${video.module_id.split('_')[1]}-${video.order_index}.mp4`,
    ];

    let matchedFile = null;
    for (const pattern of patterns) {
      matchedFile = videoFiles.find(file => 
        file.toLowerCase() === pattern.toLowerCase() ||
        file.toLowerCase().includes(pattern.toLowerCase().replace('.mp4', ''))
      );
      if (matchedFile) break;
    }

    if (matchedFile) {
      const videoUrl = `/uploads/videos/${matchedFile}`;
      
      // Only update if URL is different or empty
      if (!video.url || video.url !== videoUrl) {
        db.run(
          'UPDATE videos SET url = ? WHERE video_id = ?',
          [videoUrl, video.video_id],
          function(err) {
            if (err) {
              console.error(`❌ Error updating ${video.title}:`, err.message);
            } else {
              console.log(`✅ Updated: ${video.title}`);
              console.log(`   Module: ${video.module_id}, Order: ${video.order_index}`);
              console.log(`   URL: ${videoUrl}\n`);
              updated++;
            }
          }
        );
      } else {
        console.log(`✓ Already set: ${video.title} (${videoUrl})\n`);
      }
    } else {
      console.log(`⚠️  No file found for: ${video.title}`);
      console.log(`   Module: ${video.module_id}, Order: ${video.order_index}`);
      if (video.url) {
        console.log(`   Current URL: ${video.url}\n`);
      } else {
        console.log(`   No URL set\n`);
      }
      notFound++;
    }
  });

  // Wait a bit for async updates to complete
  setTimeout(() => {
    console.log('\n📊 Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⚠️  Not found: ${notFound}`);
    console.log(`   📁 Total files: ${videoFiles.length}`);
    console.log(`   🗄️  Total videos in DB: ${videos.length}\n`);
    
    if (notFound > 0) {
      console.log('💡 Tip: You can manually add videos using:');
      console.log('   node add-video-from-file.js <file-path> <module_id> <order_index> <title>\n');
    }
    
    db.close();
  }, 1000);
});

