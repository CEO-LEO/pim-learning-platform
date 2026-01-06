/**
 * Script to fix video URLs to use backend server URL directly
 * This is the simplest solution - just update URLs to point to backend
 * 
 * Usage:
 * 1. Set BACKEND_URL environment variable (e.g., https://your-backend.railway.app)
 * 2. node server/scripts/fix-video-urls-simple.js
 */

const db = require('../database/init');
const path = require('path');

// Get backend URL from environment or use default
const BACKEND_URL = process.env.BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

console.log('🔧 Fixing video URLs to use backend server...\n');
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
    // Skip if already a full URL
    if (video.url && (video.url.startsWith('http://') || video.url.startsWith('https://'))) {
      console.log(`⏭️  Skipped (already full URL): ${video.title}`);
      skipped++;
      return;
    }

    // Extract filename from URL
    let filename = video.url;
    if (filename && filename.includes('/')) {
      filename = filename.split('/').pop();
    }

    if (!filename || !filename.endsWith('.mp4')) {
      console.log(`⚠️  Skipped (invalid URL): ${video.title} - ${video.url}`);
      skipped++;
      return;
    }

    // Create new URL pointing to backend streaming route
    const newUrl = `${BACKEND_URL}/api/videos/stream/${filename}`;
    
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
          console.log('💡 Note: Make sure your backend server has the video files in server/uploads/videos/\n');

          db.close();
        }
      }
    );
  });
});

