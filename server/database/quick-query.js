const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'pim_learning.db');

console.log('Checking database file...');
if (!fs.existsSync(dbPath)) {
  console.error('Database file not found at:', dbPath);
  process.exit(1);
}
console.log('Database file exists');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Database opened successfully');
  
  const videoId = '1480c4e4-fec6-4c8b-8ada-9a99c685413e';
  
  db.get(
    'SELECT video_id, title, url, module_id, order_index FROM videos WHERE video_id = ?',
    [videoId],
    (err, row) => {
      if (err) {
        console.error('Query error:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (!row) {
        console.log('\n❌ Video not found in database');
      } else {
        console.log('\n✅ Video found:');
        console.log('  Video ID:', row.video_id);
        console.log('  Title:', row.title);
        console.log('  Module ID:', row.module_id);
        console.log('  Order Index:', row.order_index);
        console.log('  URL:', row.url || '(EMPTY OR NULL)');
        console.log('  URL Length:', row.url ? row.url.length : 0);
        console.log('  Has URL:', !!row.url);
        
        if (!row.url || row.url.trim() === '') {
          console.log('\n⚠️  WARNING: Video URL is empty!');
          console.log('   This is why the video cannot be played.');
        }
      }
      
      db.close();
    }
  );
});

