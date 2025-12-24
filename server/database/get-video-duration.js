const fs = require('fs');
const path = require('path');
const { getVideoDurationInSeconds } = require('get-video-duration');

// Get video file path from command line
const videoPath = process.argv[2];

if (!videoPath) {
  console.log('Usage: node get-video-duration.js <video-file-path>');
  console.log('Example: node get-video-duration.js "store-model-101.mp4"');
  process.exit(1);
}

// Resolve absolute path
let absolutePath;
if (path.isAbsolute(videoPath)) {
  absolutePath = videoPath;
} else if (videoPath.startsWith('../') || videoPath.startsWith('..\\')) {
  absolutePath = path.join(__dirname, videoPath);
} else {
  absolutePath = path.join(__dirname, '..', 'uploads', 'videos', videoPath);
}

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ File not found: ${absolutePath}`);
  process.exit(1);
}

// Get video duration using library
getVideoDurationInSeconds(absolutePath)
  .then((duration) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const totalSeconds = Math.floor(duration);
    
    console.log(`\n📹 Video Duration:`);
    console.log(`   File: ${path.basename(absolutePath)}`);
    console.log(`   Duration: ${minutes} นาที ${seconds} วินาที (${totalSeconds} วินาที)`);
    console.log(`   Full path: ${absolutePath}`);
    
    const stats = fs.statSync(absolutePath);
    console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error reading video duration:', error.message);
    console.log('\n📝 Current file info:');
    const stats = fs.statSync(absolutePath);
    console.log(`   File: ${path.basename(absolutePath)}`);
    console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Path: ${absolutePath}`);
    process.exit(1);
  });

