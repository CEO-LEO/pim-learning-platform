const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get command line arguments
const sourcePath = process.argv[2];
const moduleId = process.argv[3] || 'module_1';
const orderIndex = parseInt(process.argv[4]) || 1;
const videoTitle = process.argv[5] || `วิดีโอที่ ${orderIndex}`;

if (!sourcePath) {
  console.log('📹 Create and Add Video');
  console.log('\nUsage:');
  console.log('  node create-and-add-video.js <source-file-path> [module_id] [order_index] [title]');
  console.log('\nExample:');
  console.log('  node create-and-add-video.js "C:\\Users\\66886\\Downloads\\video.mp4" module_1 1 "วิดีโอที่ 1"');
  process.exit(1);
}

// Check if source file exists - try multiple encoding options
let actualPath = sourcePath;
if (!fs.existsSync(actualPath)) {
  // Try with different encodings for Thai characters
  const possiblePaths = [
    sourcePath,
    sourcePath.replace(/งาน/g, 'งาน'),
    Buffer.from(sourcePath, 'utf8').toString('latin1'),
  ];
  
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      actualPath = testPath;
      break;
    }
  }
  
  if (!fs.existsSync(actualPath)) {
    console.error(`❌ File not found: ${sourcePath}`);
    console.log('\n💡 Please check the file path and try again.');
    console.log('\n💡 Tips:');
    console.log('   - Make sure the file path is correct');
    console.log('   - Try using double quotes around the path');
    console.log('   - Check if the file name encoding is correct');
    console.log('   - You can drag and drop the file into the terminal');
    console.log('\n💡 Example:');
    console.log('   node create-and-add-video.js "C:\\Users\\66886\\Downloads\\video.mp4" module_1 1');
    process.exit(1);
  }
}

// Check if module exists
db.get('SELECT * FROM modules WHERE module_id = ?', [moduleId], (err, module) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    db.close();
    process.exit(1);
  }

  if (!module) {
    console.error(`❌ Module not found: ${moduleId}`);
    db.close();
    process.exit(1);
  }

  console.log(`📋 Module: ${module.title}`);

  // Get filename and sanitize it
  const originalFileName = path.basename(actualPath);
  const fileExt = path.extname(originalFileName);
  const sanitizedFileName = `video-${moduleId}-${orderIndex}${fileExt}`;
  const destDir = path.join(__dirname, '..', 'uploads', 'videos');
  const destPath = path.join(destDir, sanitizedFileName);

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy file
  try {
    console.log('📋 Copying video file...');
    console.log(`   From: ${actualPath}`);
    console.log(`   To: ${destPath}`);
    fs.copyFileSync(actualPath, destPath);
    console.log(`✅ File copied successfully!`);
  } catch (error) {
    console.error('❌ Error copying file:', error.message);
    db.close();
    process.exit(1);
  }

  // Video URL path (relative to uploads)
  const videoUrl = `/uploads/videos/${sanitizedFileName}`;

  // Check if video already exists for this module and order_index
  db.get(
    'SELECT video_id FROM videos WHERE module_id = ? AND order_index = ?',
    [moduleId, orderIndex],
    (err, existingVideo) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        db.close();
        process.exit(1);
      }

      if (existingVideo) {
        // Update existing video
        console.log('📝 Updating existing video...');
        db.run(
          'UPDATE videos SET title = ?, url = ? WHERE video_id = ?',
          [videoTitle, videoUrl, existingVideo.video_id],
          function(updateErr) {
            if (updateErr) {
              console.error('❌ Error updating video:', updateErr.message);
              db.close();
              process.exit(1);
            }

            console.log('\n✅ Video updated successfully!');
            console.log(`\n📹 Video Details:`);
            console.log(`   Title: ${videoTitle}`);
            console.log(`   Video ID: ${existingVideo.video_id}`);
            console.log(`   Module: ${moduleId} (${module.title})`);
            console.log(`   Order: ${orderIndex}`);
            console.log(`   File: ${sanitizedFileName}`);
            console.log(`   URL: ${videoUrl}`);
            console.log(`\n🌐 Video will be accessible at:`);
            console.log(`   http://localhost:5000${videoUrl}`);
            
            db.close();
            process.exit(0);
          }
        );
      } else {
        // Create new video
        console.log('📝 Creating new video...');
        const videoId = uuidv4();
        
        db.run(
          'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [videoId, moduleId, videoTitle, videoUrl, 0, orderIndex],
          function(insertErr) {
            if (insertErr) {
              console.error('❌ Error creating video:', insertErr.message);
              db.close();
              process.exit(1);
            }

            console.log('\n✅ Video created and added successfully!');
            console.log(`\n📹 Video Details:`);
            console.log(`   Title: ${videoTitle}`);
            console.log(`   Video ID: ${videoId}`);
            console.log(`   Module: ${moduleId} (${module.title})`);
            console.log(`   Order: ${orderIndex}`);
            console.log(`   File: ${sanitizedFileName}`);
            console.log(`   URL: ${videoUrl}`);
            console.log(`\n🌐 Video will be accessible at:`);
            console.log(`   http://localhost:5000${videoUrl}`);
            console.log(`\n💡 Note: Duration will be automatically detected when video is first played.`);
            
            db.close();
            process.exit(0);
          }
        );
      }
    }
  );
});

