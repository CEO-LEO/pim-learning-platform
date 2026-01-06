/**
 * Script to check current video URLs in database
 */

const db = require('../database/init');

console.log('Checking video URLs in database...\n');

db.all('SELECT video_id, title, url FROM videos', [], (err, videos) => {
  if (err) {
    console.error('Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  if (videos.length === 0) {
    console.log('No videos found in database');
    db.close();
    process.exit(0);
  }

  console.log(`Found ${videos.length} videos:\n`);

  let localhostCount = 0;
  let fullUrlCount = 0;
  let relativePathCount = 0;

  videos.forEach((video, index) => {
    const url = video.url || '';
    let status = '';
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('localhost')) {
        status = '[LOCAL]';
        localhostCount++;
      } else {
        status = '[PRODUCTION]';
        fullUrlCount++;
      }
    } else {
      status = '[RELATIVE PATH]';
      relativePathCount++;
    }

    console.log(`${index + 1}. ${video.title}`);
    console.log(`   URL: ${url} ${status}\n`);
  });

  console.log('\nSummary:');
  console.log(`  Production URLs: ${fullUrlCount}`);
  console.log(`  Localhost URLs: ${localhostCount}`);
  console.log(`  Relative paths: ${relativePathCount}`);
  console.log(`  Total: ${videos.length}\n`);

  if (localhostCount > 0 || relativePathCount > 0) {
    console.log('⚠️  Some videos need to be updated for production!');
    console.log('\nTo fix:');
    console.log('  1. Set BACKEND_URL environment variable');
    console.log('  2. Run: node server/scripts/fix-video-urls-production.js');
    console.log('  Or use: .\\fix-videos.ps1 -BackendUrl "https://your-backend.railway.app"\n');
  } else {
    console.log('✅ All videos have production URLs!\n');
  }

  db.close();
});

