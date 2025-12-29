const db = require('./init');

const videoId = process.argv[2] || '1480c4e4-fec6-4c8b-8ada-9a99c685413e';

console.log(`🔍 Checking video: ${videoId}\n`);

db.get('SELECT video_id, module_id, title, url FROM videos WHERE video_id = ?', [videoId], (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.error('❌ Video not found');
    db.close();
    process.exit(1);
  }

  console.log('✅ Video found:');
  console.log(`   Video ID: ${row.video_id}`);
  console.log(`   Module: ${row.module_id}`);
  console.log(`   Title: ${row.title}`);
  console.log(`   URL: ${row.url || '(empty)'}\n`);

  if (!row.url || row.url === '') {
    console.log('⚠️  URL is empty!');
  } else {
    console.log('✅ URL is set');
  }

  db.close();
});

