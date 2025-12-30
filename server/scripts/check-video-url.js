const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'pim_learning.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

const videoId = process.argv[2] || '1480c4e4-fec6-4c8b-8ada-9a99c685413e';

console.log(`\n🔍 Checking video: ${videoId}\n`);

// Check specific video
db.get(
  `SELECT video_id, title, url, module_id, order_index, duration 
   FROM videos 
   WHERE video_id = ?`,
  [videoId],
  (err, video) => {
    if (err) {
      console.error('Error querying video:', err.message);
      db.close();
      return;
    }
    
    if (!video) {
      console.log('❌ Video not found in database');
      db.close();
      return;
    }
    
    console.log('📹 Video Details:');
    console.log('  Video ID:', video.video_id);
    console.log('  Title:', video.title);
    console.log('  Module ID:', video.module_id);
    console.log('  Order Index:', video.order_index);
    console.log('  Duration:', video.duration, 'seconds');
    console.log('  URL:', video.url || '(empty)');
    console.log('  URL Type:', typeof video.url);
    console.log('  URL Length:', video.url?.length || 0);
    console.log('  Has URL:', !!video.url);
    console.log('  URL is Empty:', !video.url || video.url.trim() === '');
    
    if (!video.url || video.url.trim() === '') {
      console.log('\n⚠️  WARNING: Video URL is empty or null!');
      console.log('   This video cannot be played.');
    } else {
      // Extract filename
      const filename = video.url.includes('/') 
        ? video.url.split('/').pop() 
        : video.url;
      console.log('\n📁 Filename:', filename);
      console.log('   Expected path: server/uploads/videos/' + filename);
    }
    
    // Check statistics
    db.get(
      `SELECT 
        COUNT(*) as total_videos,
        COUNT(CASE WHEN url IS NULL OR url = '' THEN 1 END) as videos_without_url,
        COUNT(CASE WHEN url IS NOT NULL AND url != '' THEN 1 END) as videos_with_url
       FROM videos`,
      [],
      (err, stats) => {
        if (err) {
          console.error('Error getting stats:', err.message);
        } else {
          console.log('\n📊 Database Statistics:');
          console.log('  Total Videos:', stats.total_videos);
          console.log('  Videos with URL:', stats.videos_with_url);
          console.log('  Videos without URL:', stats.videos_without_url);
          console.log('  Percentage with URL:', 
            stats.total_videos > 0 
              ? ((stats.videos_with_url / stats.total_videos) * 100).toFixed(1) + '%'
              : '0%'
          );
        }
        
        // List videos without URL
        if (stats.videos_without_url > 0) {
          console.log('\n⚠️  Videos without URL:');
          db.all(
            `SELECT video_id, title, module_id, order_index 
             FROM videos 
             WHERE url IS NULL OR url = '' 
             LIMIT 10`,
            [],
            (err, videos) => {
              if (err) {
                console.error('Error listing videos:', err.message);
              } else {
                videos.forEach((v, i) => {
                  console.log(`  ${i + 1}. ${v.title} (${v.video_id})`);
                });
                if (stats.videos_without_url > 10) {
                  console.log(`  ... and ${stats.videos_without_url - 10} more`);
                }
              }
              db.close();
            }
          );
        } else {
          db.close();
        }
      }
    );
  }
);

