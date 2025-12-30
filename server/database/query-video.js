const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pim_learning.db');
const db = new sqlite3.Database(dbPath);

const videoId = '1480c4e4-fec6-4c8b-8ada-9a99c685413e';

console.log('Querying video:', videoId);
console.log('Database path:', dbPath);

db.get(
  'SELECT video_id, title, url, module_id, order_index FROM videos WHERE video_id = ?',
  [videoId],
  (err, row) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    if (!row) {
      console.log('Video not found');
    } else {
      console.log('\n=== Video Details ===');
      console.log('Video ID:', row.video_id);
      console.log('Title:', row.title);
      console.log('Module ID:', row.module_id);
      console.log('Order Index:', row.order_index);
      console.log('URL:', row.url || '(EMPTY OR NULL)');
      console.log('URL Length:', row.url ? row.url.length : 0);
      console.log('Has URL:', !!row.url);
    }
    
    db.close();
  }
);

