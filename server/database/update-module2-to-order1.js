const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pim_learning.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating module_2 video from order 2 to order 1...\n');

db.serialize(() => {
  // Update the video from order_index=2 to order_index=1
  db.run(
    `UPDATE videos 
     SET order_index = 1, 
         title = 'การเตรียมสินค้าอุ่นร้อน - วิดีโอที่ 1',
         url = '/uploads/videos/video-module_2-1.mp4'
     WHERE module_id = 'module_2' AND order_index = 2`,
    function(err) {
      if (err) {
        console.error('Error:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log(`✅ Updated ${this.changes} video(s)`);
      console.log('   Module: module_2 (การเตรียมสินค้าอุ่นร้อน)');
      console.log('   Order: 2 → 1');
      console.log('   Title: การเตรียมสินค้าอุ่นร้อน - วิดีโอที่ 1');
      console.log('   URL: /uploads/videos/video-module_2-1.mp4');
      console.log('\n✅ Done!');
      
      db.close();
    }
  );
});

