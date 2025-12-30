/**
 * Script to check and report LFS pointer files
 * This helps identify which video files need to be replaced with actual files
 */

const fs = require('fs');
const path = require('path');
const db = require('../database/init');

const videosPath = path.join(__dirname, '..', 'uploads', 'videos');

console.log('🔍 Checking for LFS pointer files...\n');

if (!fs.existsSync(videosPath)) {
  console.error('❌ Video directory does not exist:', videosPath);
  process.exit(1);
}

const files = fs.readdirSync(videosPath);
const videoFiles = files.filter(f => 
  f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov')
);

console.log(`📹 Found ${videoFiles.length} video files\n`);

const lfsPointers = [];
const realFiles = [];

videoFiles.forEach(filename => {
  const filePath = path.join(videosPath, filename);
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    
    if (size < 200) {
      // Check if it's an LFS pointer
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('version https://git-lfs.github.com/spec/v1')) {
        lfsPointers.push({
          filename,
          size,
          oid: content.match(/oid sha256:([a-f0-9]+)/)?.[1] || 'unknown'
        });
        console.log(`⚠️  LFS POINTER: ${filename} (${size} bytes)`);
      }
    } else {
      const sizeMB = (size / (1024 * 1024)).toFixed(2);
      realFiles.push({ filename, size, sizeMB });
      console.log(`✅ REAL FILE: ${filename} (${sizeMB} MB)`);
    }
  } catch (err) {
    console.error(`❌ Error reading ${filename}:`, err.message);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Real video files: ${realFiles.length}`);
console.log(`⚠️  LFS pointer files: ${lfsPointers.length}`);

if (lfsPointers.length > 0) {
  console.log('\n⚠️  WARNING: Found LFS pointer files that need to be replaced!');
  console.log('\nFiles that need fixing:');
  lfsPointers.forEach(f => {
    console.log(`  - ${f.filename}`);
  });
  
  console.log('\n💡 Solutions:');
  console.log('1. Use Railway Volumes:');
  console.log('   - Create a Volume in Railway');
  console.log('   - Mount it to /app/server/uploads/videos');
  console.log('   - Upload actual video files to the volume');
  console.log('');
  console.log('2. Use External Storage (S3, Cloudflare R2, etc.):');
  console.log('   - Upload videos to external storage');
  console.log('   - Update video URLs in database to point to external storage');
  console.log('');
  console.log('3. Manual Git LFS Pull:');
  console.log('   - Ensure Git LFS is properly configured');
  console.log('   - Run: git lfs pull --all');
  console.log('   - Commit and push the actual files');
  
  // Check database for videos using these files
  console.log('\n🔍 Checking database for affected videos...');
  const affectedVideos = [];
  
  lfsPointers.forEach(pointer => {
    db.all(
      'SELECT video_id, title, module_id, url FROM videos WHERE url LIKE ?',
      [`%${pointer.filename}%`],
      (err, videos) => {
        if (err) {
          console.error(`Error querying database for ${pointer.filename}:`, err);
          return;
        }
        
        if (videos.length > 0) {
          console.log(`\n  Videos using ${pointer.filename}:`);
          videos.forEach(v => {
            console.log(`    - ${v.title} (ID: ${v.video_id})`);
            affectedVideos.push(v);
          });
        }
      }
    );
  });
  
  // Wait a bit for async queries
  setTimeout(() => {
    if (affectedVideos.length > 0) {
      console.log(`\n⚠️  Total ${affectedVideos.length} videos in database are affected`);
    }
    process.exit(1);
  }, 1000);
} else {
  console.log('\n✅ All video files are real files! No LFS pointers found.');
  process.exit(0);
}

