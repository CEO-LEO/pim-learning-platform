const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pim_learning.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking module_2 videos...');

db.all(
  'SELECT order_index, title, url FROM videos WHERE module_id = ? ORDER BY order_index',
  ['module_2'],
  (err, rows) => {
    if (err) {
      console.error('Error:', err);
      process.exit(1);
    }
    
    console.log('\nCurrent videos in module_2:');
    rows.forEach(r => {
      console.log(`  ${r.order_index}. ${r.title}`);
      console.log(`     URL: ${r.url || '(empty)'}`);
    });
    console.log(`\nTotal: ${rows.length} videos`);
    
    db.close();
  }
);

