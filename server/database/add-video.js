const db = require('./init');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Get arguments from command line or config file
let moduleId, orderIndex, title, url;

if (process.argv[2] === '--config' && process.argv[3]) {
  // Read from config file
  try {
    const config = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
    moduleId = config.module_id;
    orderIndex = config.order_index;
    title = config.title;
    url = config.url || `/uploads/videos/video-${moduleId}-${orderIndex}.mp4`;
  } catch (err) {
    console.error('❌ Error reading config file:', err.message);
    process.exit(1);
  }
} else {
  // Get from command line arguments
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node add-video.js <module_id> <order_index> <title> [url]');
    console.log('   OR: node add-video.js --config <config.json>');
    console.log('Example: node add-video.js module_1 1 "การบริการ - วิดีโอที่ 1" "/uploads/videos/video-module_1-1.mp4"');
    process.exit(1);
  }
  moduleId = args[0];
  orderIndex = parseInt(args[1]);
  title = args[2];
  url = args[3] || `/uploads/videos/video-${moduleId}-${orderIndex}.mp4`;
}

console.log('📹 Adding video to database...\n');
console.log(`Module: ${moduleId}`);
console.log(`Order: ${orderIndex}`);
console.log(`Title: ${title}`);
console.log(`URL: ${url}\n`);

// Check if module exists
db.get('SELECT module_id FROM modules WHERE module_id = ?', [moduleId], (err, module) => {
  if (err) {
    console.error('❌ Error checking module:', err.message);
    db.close();
    process.exit(1);
  }

  if (!module) {
    console.error(`❌ Module ${moduleId} not found!`);
    db.close();
    process.exit(1);
  }

  // Check if order_index already exists for this module
  db.get(
    'SELECT video_id, title FROM videos WHERE module_id = ? AND order_index = ?',
    [moduleId, orderIndex],
    (err, existing) => {
      if (err) {
        console.error('❌ Error checking existing video:', err.message);
        db.close();
        process.exit(1);
      }

      if (existing) {
        console.log(`⚠️  Video with order_index ${orderIndex} already exists:`);
        console.log(`   ${existing.title}`);
        console.log('\n❌ Cancelled. Please use a different order_index.\n');
        db.close();
        process.exit(1);
      }

      // Add video
      const videoId = uuidv4();
      db.run(
        'INSERT INTO videos (video_id, module_id, title, url, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
        [videoId, moduleId, title, url, 1800, orderIndex], // Default duration 30 minutes
        function(err) {
          if (err) {
            console.error('❌ Error adding video:', err.message);
            db.close();
            process.exit(1);
          }

          console.log('✅ Video added successfully!');
          console.log(`   Video ID: ${videoId}`);
          console.log(`   Module: ${moduleId}`);
          console.log(`   Order: ${orderIndex}`);
          console.log(`   Title: ${title}`);
          console.log(`   URL: ${url}\n`);
          db.close();
        }
      );
    }
  );
});
