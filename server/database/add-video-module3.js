const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const moduleId = 'module_3';
const orderIndex = 1;
const sourcePath = 'C:\\Users\\66886\\Downloads\\งาน STORE MODEL Station 3.1.mp4';
const videoTitle = 'การจัดการอุปกรณ์และความสะอาด - วิดีโอที่ 1';

console.log('📹 Adding video to module_3...\n');

// Step 1: Check if file exists
let actualPath = sourcePath;
console.log(`🔍 Looking for file: ${sourcePath}`);
console.log(`   File exists: ${fs.existsSync(actualPath)}`);

if (!fs.existsSync(actualPath)) {
  const downloadsPath = path.join('C:', 'Users', '66886', 'Downloads');
  console.log(`🔍 Searching in: ${downloadsPath}`);
  if (fs.existsSync(downloadsPath)) {
    try {
      const files = fs.readdirSync(downloadsPath);
      console.log(`   Found ${files.length} files in Downloads`);
      
      // Try exact match first
      const exactMatch = files.find(f => f === path.basename(sourcePath));
      if (exactMatch) {
        actualPath = path.join(downloadsPath, exactMatch);
        console.log(`✅ Found exact match: ${actualPath}`);
      } else {
        // Try partial match
        const matchingFile = files.find(f => 
          f.includes('STORE') && f.includes('Station') && f.includes('3.1') && f.endsWith('.mp4')
        );
        if (matchingFile) {
          actualPath = path.join(downloadsPath, matchingFile);
          console.log(`✅ Found matching file: ${actualPath}`);
        } else {
          // List all STORE files for debugging
          const storeFiles = files.filter(f => f.includes('STORE') && f.endsWith('.mp4'));
          console.log(`   STORE files found: ${storeFiles.length}`);
          storeFiles.forEach(f => console.log(`     - ${f}`));
        }
      }
    } catch (err) {
      console.error('❌ Could not search Downloads folder:', err.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ Downloads folder not found: ${downloadsPath}`);
  }
}

if (!fs.existsSync(actualPath)) {
  console.error(`❌ File not found: ${sourcePath}`);
  process.exit(1);
}

console.log(`✅ Found file: ${actualPath}`);

// Step 2: Copy file
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
  process.exit(1);
}

const videoUrl = `/uploads/videos/${sanitizedFileName}`;

// Step 3: Check if video exists and update/create
db.serialize(() => {
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
});

