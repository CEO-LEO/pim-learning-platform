const fs = require('fs');
const path = require('path');

const videosPath = path.join(__dirname, '..', 'uploads', 'videos');

console.log('🔍 Checking video files...\n');
console.log('Path:', videosPath);
console.log('Directory exists:', fs.existsSync(videosPath));
console.log('');

if (!fs.existsSync(videosPath)) {
  console.error('❌ Video directory does not exist!');
  process.exit(1);
}

const files = fs.readdirSync(videosPath);
const videoFiles = files.filter(f => f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mov'));

console.log(`📹 Found ${videoFiles.length} video files\n`);

const results = {
  realFiles: [],
  lfsPointers: [],
  errors: []
};

videoFiles.forEach(filename => {
  const filePath = path.join(videosPath, filename);
  try {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    
    if (size < 200) {
      // Check if it's an LFS pointer
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('version https://git-lfs.github.com/spec/v1')) {
        results.lfsPointers.push({
          filename,
          size,
          sizeMB: '0.00'
        });
        console.log(`⚠️  LFS POINTER: ${filename} (${size} bytes)`);
      } else {
        results.errors.push({
          filename,
          error: 'Very small file but not LFS pointer'
        });
        console.log(`❌ ERROR: ${filename} is very small (${size} bytes) but not an LFS pointer`);
      }
    } else {
      results.realFiles.push({
        filename,
        size,
        sizeMB
      });
      console.log(`✅ REAL FILE: ${filename} (${sizeMB} MB)`);
    }
  } catch (err) {
    results.errors.push({
      filename,
      error: err.message
    });
    console.error(`❌ ERROR reading ${filename}:`, err.message);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Real video files: ${results.realFiles.length}`);
console.log(`⚠️  LFS pointer files: ${results.lfsPointers.length}`);
console.log(`❌ Errors: ${results.errors.length}`);

if (results.lfsPointers.length > 0) {
  console.log('\n⚠️  WARNING: Found LFS pointer files. These need to be replaced with actual video files.');
  console.log('Files that need fixing:');
  results.lfsPointers.forEach(f => {
    console.log(`  - ${f.filename}`);
  });
}

if (results.errors.length > 0) {
  console.log('\n❌ Errors encountered:');
  results.errors.forEach(e => {
    console.log(`  - ${e.filename}: ${e.error}`);
  });
}

process.exit(results.lfsPointers.length > 0 ? 1 : 0);

