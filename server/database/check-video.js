const db = require('./init');

const videoId = process.argv[2] || '165473f7-0c89-4d8a-b07f-33ec50bb4f88';

db.get(
  'SELECT * FROM videos WHERE video_id = ?',
  [videoId],
  (err, video) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      db.close();
      process.exit(1);
    }

    if (!video) {
      console.error('❌ Video not found');
      db.close();
      process.exit(1);
    }

    console.log('📹 Video Information:');
    console.log(JSON.stringify(video, null, 2));
    
    db.close();
    process.exit(0);
  }
);

