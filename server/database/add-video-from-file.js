const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Read path from file first, then try command line argument
const pathFile = path.join(__dirname, 'video-path.txt');
let sourcePath = null;
let readFromFile = false;

// Always try reading from file first
if (fs.existsSync(pathFile)) {
  sourcePath = fs.readFileSync(pathFile, 'utf8').trim();
  readFromFile = true;
  console.log(`📄 Read path from file: ${sourcePath}`);
}

// If not found in file, try command line argument
if (!sourcePath && process.argv[2] && !process.argv[2].startsWith('module_')) {
  sourcePath = process.argv[2];
  readFromFile = false;
}

// Parse arguments - if sourcePath is read from file, arguments are shifted
let moduleId, orderIndex, videoTitle;
if (readFromFile) {
  // Source path read from file, arguments start from index 2
  // process.argv[2] = module_id, process.argv[3] = order_index
  moduleId = process.argv[2] || 'module_1';
  orderIndex = parseInt(process.argv[3]) || 1;
  const titleFile = path.join(__dirname, 'video-title.txt');
  if (fs.existsSync(titleFile)) {
    videoTitle = fs.readFileSync(titleFile, 'utf8').trim();
  } else {
    videoTitle = process.argv[4] || `วิดีโอที่ ${orderIndex}`;
  }
  console.log(`📋 Parsed arguments: moduleId=${moduleId}, orderIndex=${orderIndex}, title=${videoTitle}`);
} else {
  // Source path provided as argument, normal parsing
  moduleId = process.argv[3] || 'module_1';
  orderIndex = parseInt(process.argv[4]) || 1;
  videoTitle = process.argv[5] || `วิดีโอที่ ${orderIndex}`;
}

if (!sourcePath) {
  console.log('📹 Create and Add Video');
  console.log('\nUsage:');
  console.log('  Method 1: node add-video-from-file.js <source-file-path> [module_id] [order_index] [title]');
  console.log('  Method 2: Put the file path in video-path.txt (one line), then run:');
  console.log('            node add-video-from-file.js [module_id] [order_index] [title]');
  console.log('\nExample:');
  console.log('  node add-video-from-file.js "C:\\Users\\66886\\Downloads\\video.mp4" module_1 1 "วิดีโอที่ 1"');
  console.log('\nOr create video-path.txt with:');
  console.log('  C:\\Users\\66886\\Downloads\\video.mp4');
  console.log('Then run: node add-video-from-file.js module_1 1 "วิดีโอที่ 1"');
  process.exit(1);
}

// Try to find the file with different methods
let actualPath = sourcePath;

// Method 1: Try direct path
if (fs.existsSync(actualPath)) {
  console.log(`✅ Found file: ${actualPath}`);
} else {
  // Method 2: Try to find file by name in Downloads folder
  const downloadsPath = path.join('C:', 'Users', '66886', 'Downloads');
  if (fs.existsSync(downloadsPath)) {
    try {
      const files = fs.readdirSync(downloadsPath);
      // Try to match the filename from the path (extract just the filename)
      const targetFileName = path.basename(sourcePath);
      let matchingFile = files.find(f => f === targetFileName);
      
      // If exact match not found, try partial match
      if (!matchingFile) {
        // Extract version number from path (e.g., "1.2" from "Station 1.2.mp4")
        const versionMatch = sourcePath.match(/Station\s*(\d+\.\d+)/i);
        if (versionMatch) {
          const version = versionMatch[1];
          console.log(`🔍 Looking for version ${version}...`);
          // Try exact version match first
          matchingFile = files.find(f => {
            const fVersion = f.match(/Station\s*(\d+\.\d+)/i)?.[1];
            return f.includes('STORE') && f.includes('Station') && fVersion === version && f.endsWith('.mp4');
          });
          
          // If exact version not found, try partial match
          if (!matchingFile) {
            matchingFile = files.find(f => 
              f.includes('STORE') && f.includes('Station') && f.includes(version) && f.endsWith('.mp4')
            );
          }
        }
        
        // If still not found, try to match by filename pattern
        if (!matchingFile) {
          const baseName = path.basename(sourcePath);
          // Try exact filename match (handling encoding issues)
          matchingFile = files.find(f => {
            try {
              return f === baseName || Buffer.from(f, 'utf8').toString() === Buffer.from(baseName, 'utf8').toString();
            } catch {
              return false;
            }
          });
        }
      }
      
      if (matchingFile) {
        actualPath = path.join(downloadsPath, matchingFile);
        console.log(`✅ Found matching file: ${actualPath}`);
      }
    } catch (err) {
      console.log('⚠️  Could not search Downloads folder');
    }
  }
  
  // Final check
  if (!fs.existsSync(actualPath)) {
    console.error(`❌ File not found: ${sourcePath}`);
    console.log('\n💡 Please try one of these methods:');
    console.log('   1. Copy the file to: server/uploads/videos/');
    console.log('   2. Put the full file path in: server/database/video-path.txt');
    console.log('   3. Use the interactive script: node add-video-interactive.js');
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
    console.log('\n📋 Copying video file...');
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
        // Update existing video (also update file if needed)
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
            console.log(`\n💡 Note: Duration will be automatically detected when video is first played.`);
            
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

