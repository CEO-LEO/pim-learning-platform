/**
 * Script to update video URLs in database to Cloudflare R2 URLs
 * 
 * Prerequisites:
 * 1. Run upload-videos-to-r2.js first
 * 2. Set environment variables:
 *    - R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
 * 
 * Usage:
 * node server/scripts/update-video-urls-to-r2.js
 */

const db = require('../database/init');
const fs = require('fs');
const path = require('path');

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://your-account-id.r2.cloudflarestorage.com/your-bucket';

// Load upload results if available
const resultsPath = path.join(__dirname, 'r2-upload-results.json');
let uploadResults = [];
if (fs.existsSync(resultsPath)) {
  uploadResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  console.log(`📋 Loaded ${uploadResults.length} upload results\n`);
}

function getR2Url(filename) {
  // Check upload results first
  const result = uploadResults.find(r => r.filename === filename);
  if (result) {
    return result.url;
  }
  
  // Fallback: construct URL from base
  return `${R2_PUBLIC_URL}/${filename}`;
}

async function updateVideoUrls() {
  console.log('🔄 Updating video URLs in database...\n');
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}\n`);

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
    const updates = [];

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

      const newUrl = getR2Url(filename);
      
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
            updates.push({ video_id: video.video_id, title: video.title, old_url: video.url, new_url: newUrl });
          }

          // Check if all updates are done
          if (updated + skipped === videos.length) {
            console.log('\n📊 Summary:');
            console.log(`   ✅ Updated: ${updated}`);
            console.log(`   ⏭️  Skipped: ${skipped}`);
            console.log(`   📁 Total: ${videos.length}\n`);

            // Save update results
            const updateResultsPath = path.join(__dirname, 'r2-update-results.json');
            fs.writeFileSync(updateResultsPath, JSON.stringify(updates, null, 2));
            console.log(`💾 Update results saved to: ${updateResultsPath}\n`);

            console.log('✅ Done!');
            console.log('\n💡 Next steps:');
            console.log('   1. Test video playback in the app');
            console.log('   2. Verify all videos are accessible\n');

            db.close();
          }
        }
      );
    });
  });
}

updateVideoUrls();

