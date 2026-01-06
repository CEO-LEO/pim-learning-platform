/**
 * Script to check if backend has video files
 * This helps diagnose video loading issues
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://pim-learning-platform-production.up.railway.app';

console.log('🔍 Checking Backend Video Files...\n');
console.log(`Backend URL: ${BACKEND_URL}\n`);

async function checkBackend() {
  try {
    // Check health endpoint
    console.log('1. Checking backend health...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
      console.log('   ✅ Backend is running');
      console.log('   Response:', JSON.stringify(healthResponse.data, null, 2));
    } catch (err) {
      console.log('   ❌ Backend health check failed:', err.message);
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        console.log('   ⚠️  Backend might not be running or URL is incorrect');
      }
    }

    // Check video files endpoint (if available)
    console.log('\n2. Checking video files...');
    try {
      const videosResponse = await axios.get(`${BACKEND_URL}/api/admin/video-files`, { timeout: 5000 });
      console.log('   ✅ Video files endpoint accessible');
      console.log('   Response:', JSON.stringify(videosResponse.data, null, 2));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('   ⚠️  Authentication required (this is normal)');
      } else {
        console.log('   ⚠️  Video files endpoint not accessible:', err.message);
      }
    }

    // Test video streaming endpoint
    console.log('\n3. Testing video streaming endpoint...');
    const testVideoUrl = `${BACKEND_URL}/api/videos/stream/video-module_1-1.mp4`;
    try {
      const videoResponse = await axios.head(testVideoUrl, { timeout: 5000 });
      console.log('   ✅ Video streaming endpoint works');
      console.log('   Status:', videoResponse.status);
      console.log('   Content-Type:', videoResponse.headers['content-type']);
      console.log('   Content-Length:', videoResponse.headers['content-length']);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('   ⚠️  Authentication required (this is normal)');
        console.log('   ⚠️  But video file might not exist (404 would be different)');
      } else if (err.response?.status === 404) {
        console.log('   ❌ Video file not found!');
        console.log('   ⚠️  Backend does not have video files');
      } else {
        console.log('   ❌ Video streaming failed:', err.message);
      }
    }

    console.log('\n📋 Summary:');
    console.log('   If backend is running but videos are 404, you need to:');
    console.log('   1. Upload video files to backend server');
    console.log('   2. Or use external storage (Cloudflare R2)');
    console.log('');

  } catch (error) {
    console.error('❌ Error checking backend:', error.message);
    process.exit(1);
  }
}

checkBackend();

