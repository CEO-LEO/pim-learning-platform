const db = require('./init');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const sourcePath = process.argv[2];
const moduleId = process.argv[3] || 'module_1';
const orderIndex = parseInt(process.argv[4]) || 1;

if (!sourcePath) {
  console.log('📹 Video File Manager');
  console.log('\nUsage:');
  console.log('  node add-video.js <source-file-path> [module_id] [order_index]');
  console.log('\nExample:');
  console.log('  node add-video.js "C:\\Users\\66886\\Downloads\\video.mp4" module_1 1');
  console.log('  node add-video.js "C:\\path\\to\\video.mp4" module_2 2');
  process.exit(1);
}

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ File not found: ${sourcePath}`);
  console.log('\n💡 Please check the file path and try again.');
  process.exit(1);
}

// Get filename
const fileName = path.basename(sourcePath);
const destDir = path.join(__dirname, '..', 'uploads', 'videos');
const destPath = path.join(destDir, fileName);

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy file
try {
  console.log('📋 Copying video file...');
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ File copied to: ${destPath}`);
} catch (error) {
  console.error('❌ Error copying file:', error.message);
  db.close();
  process.exit(1);
}

// Video URL path (relative to uploads)
const videoUrl = `/uploads/videos/${fileName}`;

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
            if (videos.length === 0) {
              console.log('  No videos found for this module.');
            } else {
              videos.forEach(v => {
                console.log(`  ${v.order_index}. ${v.title} (${v.video_id})`);
              });
            }
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
      [videoUrl, video.video_id],
      function(updateErr) {
        if (updateErr) {
          console.error('❌ Error updating video:', updateErr.message);
          db.close();
          process.exit(1);
        }

        console.log('\n✅ Video added successfully!');
        console.log(`\n📹 Video Details:`);
        console.log(`   Title: ${video.title}`);
        console.log(`   Video ID: ${video.video_id}`);
        console.log(`   Module: ${moduleId}`);
        console.log(`   Order: ${order_index}`);
        console.log(`   File: ${fileName}`);
        console.log(`   URL: ${videoUrl}`);
        console.log(`\n🌐 Video will be accessible at:`);
        console.log(`   http://localhost:5000${videoUrl}`);
        console.log(`\n💡 Refresh your browser to see the video!`);
        
        db.close();
        process.exit(0);
      }
    );
  }
);

