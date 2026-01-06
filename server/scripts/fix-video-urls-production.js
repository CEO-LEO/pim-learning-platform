/**
 * Script to fix video URLs for production deployment
 * Updates URLs to use production backend URL
 * 
 * Usage:
 * 1. Set BACKEND_URL environment variable to your production backend URL
 *    Example: $env:BACKEND_URL="https://your-backend.railway.app"
 * 2. node server/scripts/fix-video-urls-production.js
 * 
 * Or edit this file and set BACKEND_URL directly
 */

const db = require('../database/init');

// ⚠️ IMPORTANT: Set your production backend URL here
// Examples:
// - Railway: https://your-app.railway.app
// - Render: https://your-app.onrender.com
// - Heroku: https://your-app.herokuapp.com
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-url.com';

if (BACKEND_URL === 'https://your-backend-url.com') {
  console.error('❌ Error: Please set BACKEND_URL environment variable!');
  console.error('\nUsage:');
  console.error('  $env:BACKEND_URL="https://your-backend.railway.app"');
  console.error('  node server/scripts/fix-video-urls-production.js\n');
  console.error('Or edit this file and set BACKEND_URL directly\n');
  process.exit(1);
}

console.log('🔧 Fixing video URLs for production...\n');
console.log(`Backend URL: ${BACKEND_URL}\n`);

// Get all videos
db.all('SELECT video_id, title, url FROM videos', [], (err, videos) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    db.close();
    process.exit(1);
  }

  if (videos.length === 0) {
    console.log('⚠️  No videos found in database');
    db.close();
    process.exit(0);
  }

  console.log(`Found ${videos.length} videos in database\n`);

  let updated = 0;
  let skipped = 0;

  videos.forEach((video) => {
    // Extract filename from current URL
    let filename = null;
    
    if (video.url) {
      // If it's already a full URL, extract filename
      if (video.url.includes('/')) {
        filename = video.url.split('/').pop();
      } else {
        filename = video.url;
      }
    }

    if (!filename || !filename.endsWith('.mp4')) {
      console.log(`⚠️  Skipped (invalid URL): ${video.title} - ${video.url}`);
      skipped++;
      return;
    }

    // Create new URL pointing to backend streaming route
    const newUrl = `${BACKEND_URL}/api/videos/stream/${filename}`;
    
    // Skip if URL is already correct
    if (video.url === newUrl) {
      console.log(`⏭️  Skipped (already correct): ${video.title}`);
      skipped++;
      return;
    }
    
    db.run(
      'UPDATE videos SET url = ? WHERE video_id = ?',
      [newUrl, video.video_id],
      function(updateErr) {
        if (updateErr) {
          console.error(`❌ Error updating ${video.title}:`, updateErr.message);
        } else {
          console.log(`✅ Updated: ${video.title}`);
          console.log(`   Old: ${video.url}`);
          console.log(`   New: ${newUrl}\n`);
          updated++;
        }

        // Check if all updates are done
        if (updated + skipped === videos.length) {
          console.log('\n📊 Summary:');
          console.log(`   ✅ Updated: ${updated}`);
          console.log(`   ⏭️  Skipped: ${skipped}`);
          console.log(`   📁 Total: ${videos.length}\n`);

          console.log('✅ Done!\n');
          console.log('💡 Next steps:');
          console.log('   1. Make sure your backend server has video files in server/uploads/videos/');
          console.log('   2. Test video playback in your app');
          console.log('   3. If videos still don\'t work, check backend logs\n');

          db.close();
        }
      }
    );
  });
});

