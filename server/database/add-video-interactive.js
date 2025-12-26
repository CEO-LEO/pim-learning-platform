const db = require('./init');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('📹 Create and Add Video - Interactive Mode\n');

  // Get source file path
  const sourcePath = await question('Enter video file path: ');
  
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error(`❌ File not found: ${sourcePath}`);
    console.log('\n💡 Please check the file path and try again.');
    rl.close();
    db.close();
    process.exit(1);
  }

  // Get module ID
  const moduleId = await question('Enter module ID (default: module_1): ') || 'module_1';
  
  // Get order index
  const orderIndexInput = await question('Enter order index (default: 1): ') || '1';
  const orderIndex = parseInt(orderIndexInput) || 1;
  
  // Get video title
  const videoTitle = await question(`Enter video title (default: วิดีโอที่ ${orderIndex}): `) || `วิดีโอที่ ${orderIndex}`;

  // Check if module exists
  db.get('SELECT * FROM modules WHERE module_id = ?', [moduleId], async (err, module) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      rl.close();
      db.close();
      process.exit(1);
    }

    if (!module) {
      console.error(`❌ Module not found: ${moduleId}`);
      rl.close();
      db.close();
      process.exit(1);
    }

    console.log(`\n📋 Module: ${module.title}`);

    // Get filename and sanitize it
    const originalFileName = path.basename(sourcePath);
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
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ File copied to: ${destPath}`);
    } catch (error) {
      console.error('❌ Error copying file:', error.message);
      rl.close();
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
          rl.close();
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
                rl.close();
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
              
              rl.close();
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
                rl.close();
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
              
              rl.close();
              db.close();
              process.exit(0);
            }
          );
        }
      }
    );
  });
}

main();

