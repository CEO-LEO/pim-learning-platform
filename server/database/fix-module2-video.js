const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const moduleId = 'module_2';
const orderIndex = 1;
const sourcePath = 'C:\\Users\\66886\\Downloads\\งาน STORE MODEL Station 2.1.mp4';
const videoTitle = 'การเตรียมสินค้าอุ่นร้อน - วิดีโอที่ 1';

console.log('🔧 Fixing module_2 video...\n');

// Step 1: Delete video at order_index = 2 if exists
db.serialize(() => {
  db.get(
    'SELECT video_id, url FROM videos WHERE module_id = ? AND order_index = ?',
    [moduleId, 2],
    (err, video2) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        process.exit(1);
      }

      if (video2) {
        console.log('🗑️  Deleting video at order_index = 2...');
        db.run('DELETE FROM video_progress WHERE video_id = ?', [video2.video_id]);
        db.run('DELETE FROM videos WHERE video_id = ?', [video2.video_id], function() {
          console.log(`✅ Deleted video: ${video2.video_id}\n`);
          proceedWithAdd();
        });
      } else {
        console.log('ℹ️  No video found at order_index = 2\n');
        proceedWithAdd();
      }
    }
  );
});

function proceedWithAdd() {
  // Step 2: Check if file exists
  let actualPath = sourcePath;
  if (!fs.existsSync(actualPath)) {
    const downloadsPath = path.join('C:', 'Users', '66886', 'Downloads');
    if (fs.existsSync(downloadsPath)) {
      try {
        const files = fs.readdirSync(downloadsPath);
        const matchingFile = files.find(f => 
          f.includes('STORE') && f.includes('Station') && f.includes('2.1') && f.endsWith('.mp4')
        );
        if (matchingFile) {
          actualPath = path.join(downloadsPath, matchingFile);
        }
      } catch (err) {
        console.error('❌ Could not search Downloads folder');
        db.close();
        process.exit(1);
      }
    }
  }

  if (!fs.existsSync(actualPath)) {
    console.error(`❌ File not found: ${sourcePath}`);
    db.close();
    process.exit(1);
  }

  console.log(`✅ Found file: ${actualPath}`);

  // Step 3: Copy file
  const fileExt = path.extname(actualPath);
  const sanitizedFileName = `video-${moduleId}-${orderIndex}${fileExt}`;
  const destDir = path.join(__dirname, '..', 'uploads', 'videos');
  const destPath = path.join(destDir, sanitizedFileName);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    console.log(`\n📋 Copying video file...`);
    console.log(`   From: ${actualPath}`);
    console.log(`   To: ${destPath}`);
    fs.copyFileSync(actualPath, destPath);
    console.log(`✅ File copied successfully!`);
  } catch (error) {
    console.error('❌ Error copying file:', error.message);
    db.close();
    process.exit(1);
  }

  const videoUrl = `/uploads/videos/${sanitizedFileName}`;

  // Step 4: Check if video at order_index = 1 exists
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
        console.log('\n📝 Updating existing video...');
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
            console.log(`   Module: ${moduleId}`);
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
        console.log('\n📝 Creating new video...');
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
            console.log(`   Module: ${moduleId}`);
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
}

