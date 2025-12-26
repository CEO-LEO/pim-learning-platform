const db = require('./init');

const fs = require('fs');
const path = require('path');

const moduleId = process.argv[2] || 'module_1';
const orderIndex = parseInt(process.argv[3]) || 1;
let newTitle = process.argv[4];

// If no title provided, try reading from file
if (!newTitle) {
  const titleFile = path.join(__dirname, 'video-title.txt');
  if (fs.existsSync(titleFile)) {
    newTitle = fs.readFileSync(titleFile, 'utf8').trim();
  } else {
    newTitle = `วิดีโอที่ ${orderIndex}`;
  }
}

if (!newTitle || newTitle === `วิดีโอที่ ${orderIndex}`) {
  console.log('Usage: node update-video-title.js [module_id] [order_index] [new_title]');
  console.log('Or put title in video-title.txt and run: node update-video-title.js module_1 1');
  console.log('Example: node update-video-title.js module_1 1 "การบริการ - วิดีโอที่ 1"');
  process.exit(1);
}

db.run(
  'UPDATE videos SET title = ? WHERE module_id = ? AND order_index = ?',
  [newTitle, moduleId, orderIndex],
  function(err) {
    if (err) {
      console.error('❌ Error:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`✅ Updated video title to: ${newTitle}`);
    console.log(`   Module: ${moduleId}, Order: ${orderIndex}`);
    console.log(`   Rows affected: ${this.changes}`);
    
    db.close();
    process.exit(0);
  }
);

