/**
 * Script to upload video files to Cloudflare R2
 * 
 * Prerequisites:
 * 1. Install: npm install @aws-sdk/client-s3
 * 2. Set environment variables:
 *    - R2_ACCOUNT_ID=your-account-id
 *    - R2_ACCESS_KEY_ID=your-access-key
 *    - R2_SECRET_ACCESS_KEY=your-secret-key
 *    - R2_BUCKET_NAME=your-bucket-name
 *    - R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com (optional)
 * 
 * Usage:
 * node server/scripts/upload-videos-to-r2.js
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pim-videos';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

// Validate environment variables
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ Error: Missing required environment variables!');
  console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  console.error('\nSet them in .env file or as environment variables');
  process.exit(1);
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const videosDir = path.join(__dirname, '..', 'uploads', 'videos');

async function uploadVideo(filename) {
  const filePath = path.join(videosDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filename}`);
    return null;
  }

  // Check if file already exists in R2
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
    }));
    console.log(`⏭️  Skipped (already exists): ${filename}`);
    return `${R2_PUBLIC_URL}/${filename}`;
  } catch (err) {
    // File doesn't exist, proceed with upload
  }

  const fileContent = fs.readFileSync(filePath);
  const fileSize = fileContent.length;

  console.log(`📤 Uploading: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filename,
      Body: fileContent,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000',
    }));

    const publicUrl = `${R2_PUBLIC_URL}/${filename}`;
    console.log(`✅ Uploaded: ${filename}`);
    console.log(`   URL: ${publicUrl}\n`);
    return publicUrl;
  } catch (err) {
    console.error(`❌ Error uploading ${filename}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Uploading videos to Cloudflare R2...\n');
  console.log('Configuration:');
  console.log(`  Account ID: ${R2_ACCOUNT_ID}`);
  console.log(`  Bucket: ${R2_BUCKET_NAME}`);
  console.log(`  Public URL: ${R2_PUBLIC_URL}\n`);

  if (!fs.existsSync(videosDir)) {
    console.error(`❌ Videos directory not found: ${videosDir}`);
    process.exit(1);
  }

  const videoFiles = fs.readdirSync(videosDir).filter(file => 
    file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mov')
  );

  if (videoFiles.length === 0) {
    console.error('❌ No video files found!');
    process.exit(1);
  }

  console.log(`Found ${videoFiles.length} video files\n`);

  const results = [];
  for (const file of videoFiles) {
    const url = await uploadVideo(file);
    if (url) {
      results.push({ filename: file, url });
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Uploaded: ${results.length}`);
  console.log(`   ❌ Failed: ${videoFiles.length - results.length}`);
  console.log(`   📁 Total: ${videoFiles.length}\n`);

  // Save results to JSON file
  const resultsPath = path.join(__dirname, 'r2-upload-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${resultsPath}\n`);

  console.log('✅ Done!');
  console.log('\nNext step: Update database URLs using:');
  console.log('  node server/scripts/update-video-urls-to-r2.js\n');
}

main().catch(console.error);

