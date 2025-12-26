const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'pim_learning.db');
const db = new sqlite3.Database(dbPath);

const moduleId = 'module_4';
const orderIndex = 3;
const videoTitle = 'การจัดการและบริหารสินค้า - วิดีโอที่ 3';
const videoUrl = '/uploads/videos/video-module_4-3.mp4';

console.log('📹 Adding video to module_4 (order 3)...\n');

db.serialize(() => {
  // Check if video exists
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
        db.run(
          'UPDATE videos SET title = ?, url = ? WHERE video_id = ?',
          [videoTitle, videoUrl, existingVideo.video_id],
          function(updateErr) {
            if (updateErr) {
              console.error('❌ Error updating video:', updateErr.message);
              db.close();
              process.exit(1);
            }

            console.log('✅ Video updated successfully!');
            console.log(`   Title: ${videoTitle}`);
            console.log(`   URL: ${videoUrl}`);
            console.log(`   Rows affected: ${this.changes}`);
            db.close();
            process.exit(0);
          }
        );
      } else {
        // Create new video
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

            console.log('✅ Video created successfully!');
            console.log(`   Video ID: ${videoId}`);
            console.log(`   Title: ${videoTitle}`);
            console.log(`   URL: ${videoUrl}`);
            console.log(`   Module: ${moduleId}`);
            console.log(`   Order: ${orderIndex}`);
            db.close();
            process.exit(0);
          }
        );
      }
    }
  );
});

