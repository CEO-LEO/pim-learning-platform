const db = require('./init');

const moduleId = process.argv[2] || 'module_2';

db.all(
  'SELECT order_index, title, video_id FROM videos WHERE module_id = ? ORDER BY order_index',
  [moduleId],
  (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      db.close();
      process.exit(1);
    }
    
    console.log(`Videos in ${moduleId}:`);
    if (rows.length === 0) {
      console.log('  (no videos)');
    } else {
      rows.forEach(r => {
        console.log(`  Order ${r.order_index}: ${r.title} (${r.video_id})`);
      });
    }
    
    db.close();
  }
);

